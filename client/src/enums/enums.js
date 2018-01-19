// @flow

import sortBy from 'lodash/sortBy';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatch, dispatchSet, Input} from 'redux-easy';

import Button from '../share/button';
import {showModal} from '../share/sd-modal';
import {validNameHandler} from '../util/input-util';
import {deleteResource, getJson, postJson} from '../util/rest-util';

import type {
  EnumMapType,
  EnumMemberType,
  EnumType,
  StateType,
  UiType
} from '../types';

import './enums.css';

type PropsType = {
  enumMap: EnumMapType,
  ui: UiType
};

class Enums extends Component<PropsType> {
  added: boolean;

  addEnum = async () => {
    const {enumMap, ui: {newEnumName}} = this.props;

    if (await this.isDuplicateTypeName(newEnumName)) {
      showModal({
        error: true,
        title: 'Duplicate Type Name',
        message:
          'The enum name matches the name of ' +
          'an existing enum or builtin type.'
      });
      return;
    }

    const anEnum: EnumType = {
      id: 0,
      name: newEnumName,
      memberMap: {}
    };
    const res = await postJson('enum', anEnum);
    anEnum.id = await res.text();
    anEnum.memberMap = {};
    const newMap = {
      ...enumMap,
      [anEnum.id]: anEnum
    };

    this.added = true;
    dispatchSet('ui.newEnumName', '');
    dispatchSet('enumMap', newMap);
  };

  addEnumMember = async () => {
    const {
      ui: {newEnumMemberName, newEnumMemberValue, selectedEnumId}
    } = this.props;

    const enumMember: EnumMemberType = {
      id: 0,
      enumId: selectedEnumId,
      name: newEnumMemberName,
      value: Number(newEnumMemberValue)
    };

    if (this.isDuplicateMember(enumMember)) {
      showModal({
        error: true,
        title: 'Duplicate Enum Member',
        message: 'The enum member has a duplicate name or value.'
      });
      return;
    }

    const res = await postJson('enum_member', enumMember);
    enumMember.id = Number(await res.text());
    this.added = true;

    dispatch('addEnumMember', enumMember);
  };

  componentWillMount() {
    this.loadEnums();
  }

  deleteEnum = async (anEnum: EnumType) => {
    const propertiesUsing = await this.getTypesUsingEnum(anEnum);

    if (propertiesUsing.length) {
      const message =
        'This enum cannot be deleted ' +
        'because it it being used by the following properties:' +
        propertiesUsing.join(', ');
      showModal({
        error: true,
        title: 'Enum in Use',
        message
      });
      return;
    }

    // Delete the enum.
    const {enumMap} = this.props;
    await deleteResource(`enum/${anEnum.id}`);
    const newMap = {...enumMap};
    delete newMap[anEnum.id];
    dispatchSet('enumMap', newMap);
  };

  deleteEnumMember = async (enumMember: EnumMemberType) => {
    // Delete the enum member.
    await deleteResource(`enum_member/${enumMember.id}`);

    dispatch('deleteEnumMember', enumMember);
  };

  getSelectedEnum = () => {
    const {enumMap, ui: {selectedEnumId}} = this.props;
    return enumMap[selectedEnumId];
  };

  getTypesUsingEnum = async (anEnum: EnumType): Promise<string[]> => {
    const res = await getJson('types/enums/used-by/' + anEnum.id);
    return ((res: any): string[]);
  };

  isDuplicateMember = (enumMember: EnumMemberType): boolean => {
    const selectedEnum = this.getSelectedEnum();
    if (!selectedEnum) return false;

    const {memberMap} = selectedEnum;
    const dupName = memberMap
      ? Object.keys(memberMap).includes(enumMember.name)
      : false;
    const dupValue = Object.values(memberMap).includes(enumMember.value);
    return dupName || dupValue;
  };

  isDuplicateTypeName = async (enumName: string): Promise<boolean> => {
    const names = ((await getJson('types/names'): any): string[]);
    return names.includes(enumName);
  };

  loadEnums = async () => {
    const json = await getJson('types/enums');
    const enums = ((json: any): EnumType[]);
    const enumMap = enums.reduce((map, anEnum) => {
      map[anEnum.id] = anEnum;
      return map;
    }, {});
    dispatchSet('enumMap', enumMap);
  };

  renderEnumMemberTableHead = () => (
    <thead>
      <tr>
        <th>Name</th>
        <th>Value</th>
        <th>Actions</th>
      </tr>
    </thead>
  );

  renderEnumTableHead = () => (
    <thead>
      <tr>
        <th>Name</th>
        <th>Actions</th>
      </tr>
    </thead>
  );

  renderEnumMemberTableInputRow = () => {
    const {ui: {newEnumMemberName}} = this.props;
    return (
      <tr>
        <td>
          <Input
            className="enum-member-name-input"
            onKeyDown={validNameHandler}
            path="ui.newEnumMemberName"
          />
        </td>
        <td>
          <Input
            className="enum-member-value-input"
            path="ui.newEnumMemberValue"
            type="number"
          />
        </td>
        <td className="actions-column">
          <Button
            className="add"
            disabled={newEnumMemberName === ''}
            icon="plus"
            onClick={this.addEnumMember}
            tooltip="add enum member"
          />
        </td>
      </tr>
    );
  };

  renderEnumTableInputRow = () => {
    const {ui: {newEnumName}} = this.props;
    return (
      <tr>
        <td>
          <Input
            className="enum-name-input"
            onKeyDown={validNameHandler}
            path="ui.newEnumName"
          />
        </td>
        <td className="actions-column">
          <Button
            className="add"
            disabled={newEnumName === ''}
            icon="plus"
            onClick={this.addEnum}
            tooltip="add enum"
          />
        </td>
      </tr>
    );
  };

  renderEnumMemberTableRow = (enumMember: EnumMemberType) => (
    <tr key={enumMember.name}>
      <td>{enumMember.name}</td>
      <td>{enumMember.value}</td>
      <td className="actions-column">
        <Button
          className="delete"
          icon="trash-o"
          onClick={() => this.deleteEnumMember(enumMember)}
          tooltip="delete enum value"
        />
      </td>
    </tr>
  );

  renderEnumTableRow = (anEnum: EnumType) => {
    const {ui: {selectedEnumId}} = this.props;
    return (
      <tr
        className={anEnum.id === selectedEnumId ? 'selected-enum' : ''}
        key={anEnum.name}
      >
        <td onClick={() => this.selectEnum(anEnum)}>{anEnum.name}</td>
        <td className="actions-column">
          <Button
            className="delete"
            icon="trash-o"
            onClick={() => this.deleteEnum(anEnum)}
            tooltip="delete enum"
          />
        </td>
      </tr>
    );
  };

  selectEnum = (anEnum: EnumType) =>
    dispatchSet('ui.selectedEnumId', anEnum.id);

  render() {
    const {enumMap, ui: {selectedEnumId}} = this.props;
    const enums = ((Object.values(enumMap): any): EnumType[]);
    const sortedEnums = sortBy(enums, ['name']);

    let sortedEnumMembers = [];
    if (selectedEnumId) {
      const selectedEnum = this.getSelectedEnum();
      if (selectedEnum) {
        const enumMembers = ((Object.values(
          selectedEnum.memberMap
        ): any): EnumMemberType[]);
        sortedEnumMembers = sortBy(enumMembers, ['value']);
      }
    }

    return (
      <section className="enums">
        <h3>Enums</h3>

        <table className="enum-table">
          {this.renderEnumTableHead()}
          <tbody>
            {this.renderEnumTableInputRow()}
            {sortedEnums.map(anEnum => this.renderEnumTableRow(anEnum))}
          </tbody>
        </table>

        {selectedEnumId !== -1 && (
          <table className="enum-member-table">
            {this.renderEnumMemberTableHead()}
            <tbody>
              {this.renderEnumMemberTableInputRow()}
              {sortedEnumMembers.map(enumMember =>
                this.renderEnumMemberTableRow(enumMember)
              )}
            </tbody>
          </table>
        )}
      </section>
    );
  }
}

const mapState = (state: StateType): PropsType => {
  const {enumMap, ui} = state;
  return {enumMap, ui};
};

export default connect(mapState)(Enums);
