-- TODO: Add lots of "not null" constraints!

drop database if exists smartdevice;
create database smartdevice;

use smartdevice;

create table alert_type (
  id int auto_increment primary key,
  name text
);

create table organization (
  id int auto_increment primary key,
  name text
);

create table type (
  id int auto_increment primary key,
  name text,
  parentId int null, -- okay to not have parent
  foreign key (parentId)
    references type (id)
    on delete cascade
);

create table type_data (
  id int auto_increment primary key,
  kind text,
  name text,
  typeId int null,
  foreign key (typeId)
    references type (id)
    on delete cascade
);

create table instance (
  id int auto_increment primary key,
  internalId text,
  name text,
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

create table alert (
  id int auto_increment primary key,
  alertTypeId int,
  description text,
  instanceId int,
  foreign key (alertTypeId)
    references alert_type (id)
    on delete cascade,
  foreign key (instanceId)
    references instance (id)
    on delete cascade
);

create table alert_condition (
  id int auto_increment primary key,
  alertTypeId int,
  expression text,
  typeId int,
  foreign key (alertTypeId)
    references alert_type (id)
    on delete cascade,
  foreign key (typeId)
    references type (id)
    on delete cascade
);

create table instance_data (
  id int auto_increment primary key,
  instanceId int,
  dataKey text, -- "key" is a reserved word
  dataValue text, -- "value" is a reserved word
  foreign key (instanceId)
    references instance (id)
    on delete cascade
);

create table role (
  id int auto_increment primary key,
  name text
);

create table permission (
  id int auto_increment primary key,
  name text,
  roleId int,
  foreign key (roleId)
    references role (id)
    on delete cascade
);

create table user (
  id int auto_increment primary key,
  email varchar(254), -- official maximum length of an email address
  encryptedPassword text,
  firstName text,
  lastName text,
  organizationId int,
  foreign key (organizationId)
    references organization (id)
    on delete cascade
);
alter table user add index (email);

create table snooze (
  id int auto_increment primary key,
  durationMs int,
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

insert into instance (id, name, organizationId, parentId, typeId) values
  (2, 'IIOT', 1, 1, 2),
  (3, 'demo-machine', 1, 2, 3),
  (4, 'valve-a', 1, 3, 4),
  (5, 'valve-b', 1, 3, 4);

insert into instance_data (instanceId, dataKey, dataValue) values
  (4, 'pressure', '300'),
  (4, 'temperature', '90'),
  (5, 'pressure', '310'),
  (5, 'temperature', '30');

insert into alert_type (id, name) values
  (1, 'high pressure'),
  (2, 'low pressure'),
  (3, 'high temperature'),
  (4, 'low temperature');

insert into alert_condition (id, alertTypeId, expression, typeId) values
  (1, 1, '> 300', 4), -- high pressure in a valve
  (2, 4, '< 40', 4); -- low temperature in a valve
*/
