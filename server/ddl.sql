-- TODO: Add lots of "not null" constraints!

drop database if exists smartdevice;
create database smartdevice;

use smartdevice;

create table type (
  id int auto_increment primary key,
  name text not null,
  parentId int null, -- okay to not have parent
  foreign key (parentId)
    references type (id)
    on delete cascade
);

create table type_data (
  id int auto_increment primary key,
  kind text not null,
  name text not null,
  typeId int,
  foreign key (typeId)
    references type (id)
    on delete cascade
);

create table organization (
  id int auto_increment primary key,
  name text not null
);

create table instance (
  id int auto_increment primary key,
  internalId text null,
  name text not null,
  organizationId int,
  parentId int,
  typeId int,
  foreign key (organizationId)
    references organization (id)
    on delete cascade,
  foreign key (parentId)
    references instance (id)
    on delete cascade,
  foreign key (typeId)
    references type (id)
    on delete cascade
);

create table alert_type (
  id int auto_increment primary key,
  name text not null,
  expression text not null, -- JS code
  typeId int, -- type to which it applies; ex. valve
  foreign key (typeId)
    references type (id)
    on delete cascade
);

create table alert (
  id int auto_increment primary key,
  alertTypeId int not null,
  description text not null,
  dynamic boolean not null,
  instanceId int,
  timestamp bigint,
  foreign key (alertTypeId)
    references alert_type (id)
    on delete cascade,
  foreign key (instanceId)
    references instance (id)
    on delete cascade
);

create table instance_data (
  id int auto_increment primary key,
  instanceId int,
  dataKey text not null, -- "key" is a reserved word
  dataValue text not null, -- "value" is a reserved word
  foreign key (instanceId)
    references instance (id)
    on delete cascade
);

create table role (
  id int auto_increment primary key,
  name text not null
);

create table permission (
  id int auto_increment primary key,
  name text not null,
  roleId int,
  foreign key (roleId)
    references role (id)
    on delete cascade
);

create table user (
  id int auto_increment primary key,
  email varchar(254), -- official maximum length of an email address
  encryptedPassword text,
  firstName text not null,
  lastName text not null,
  organizationId int,
  foreign key (organizationId)
    references organization (id)
    on delete cascade
);
alter table user add index (email);

create table snooze (
  id int auto_increment primary key,
  durationMs int not null,
  instanceId int,
  userId int,
  foreign key (instanceId)
    references instance (id)
    on delete cascade,
  foreign key (userId)
    references user (id)
    on delete cascade
);

create table subscription (
  id int auto_increment primary key,
  alertTypeId int,
  instanceId int,
  userId int,
  foreign key (alertTypeId)
    references alert_type (id)
    on delete cascade,
  foreign key (instanceId)
    references instance (id)
    on delete cascade,
  foreign key (userId)
    references user (id)
    on delete cascade
);

create table user_role (
  roleId int,
  userId int,
  foreign key (roleId)
    references role (id)
    on delete cascade,
  foreign key (userId)
    references user (id)
    on delete cascade
);

insert into organization (id, name)
values (1, 'Object Computing, Inc.');

insert into user (id, email, firstName, lastName, organizationId) values
  (1, 'mark@objectcomputing.com', 'Mark', 'Volkmann', 1),
  (2, 'stanleyk@objectcomputing.com', 'Kevin', 'Stanley', 1);

insert into type (id, name) values (0, 'root');
insert into instance (id, name) values (0, 'root');

/*
insert into type (id, name) values (1, 'site');
insert into type (id, name, parentId) values
  (2, 'department', 1),
  (3, 'machine', 2),
  (4, 'valve', 3);

insert into instance (id, name, organizationId, typeId)
values (1, 'Creve Coeur', 1, 1);
*/
