import opendds from 'opendds';
import path from 'path';
import fs from 'fs';

function ValveDataReader() {
  this.valveReader = null;
  this.factory = null;
  this.library = null;
  this.processInitialized = false;
}

// Topics is "Valve"
// Symbols uses transient-local durability, otherwise QoS is default
ValveDataReader.prototype.subscribe = function(sample_received) {
  var qos = {
    DataReaderQos: {durability: 'TRANSIENT_LOCAL_DURABILITY_QOS'}
  };
  try {
    this.valveReader = this.participant.subscribe(
      'Valve',
      'Nexmatix::ValveData',
      qos,
      function(dr, sInfo, sample) {
        if (sInfo.valid_data) {
          sample.source_timestamp = sInfo.source_timestamp;
          sample_received(sample);
        }
      }
    );
  } catch (e) {
    console.log(e);
  }
};

ValveDataReader.prototype.deleteParticipant = function() {
  if (this.participant) {
    console.log('deleting participant');
    this.factory.delete_participant(this.participant);
    delete this.participant;
    console.log('deleted participant');
  }
};

ValveDataReader.prototype.finalizeDds = function() {
  if (this.factory) {
    this.deleteParticipant();
    console.log('finalizing factory');
    opendds.finalize(this.factory);
    delete this.factory;
    console.log('factory finalized');
  }
};

ValveDataReader.prototype.createParticipant = function(secure = true) {
  var DOMAIN_ID = 23;

  console.log(`creating ${secure ? 'secure ' : ''}participant`);
  var ddsCerts = process.env.DDS_ROOT + '/tests/security/certs';
  this.participant = this.factory.create_participant(DOMAIN_ID, {
    property: {
      value: [
        {
          name: 'dds.sec.auth.identity_ca',
          value: 'file:' + ddsCerts + '/identity/identity_ca_cert.pem'
        },

        {
          name: 'dds.sec.access.permissions_ca',
          value: 'file:' + ddsCerts + '/permissions/permissions_ca_cert.pem'
        },

        {
          name: 'dds.sec.access.governance',
          value: 'file:' + '../security/governance_signed.p7s'
        },

        {
          name: 'dds.sec.auth.identity_certificate',
          value: 'file:' +  ddsCerts + '/identity/test_participant_02_cert.pem'
        },

        {
          name: 'dds.sec.auth.private_key',
          value: 'file:' + ddsCerts + '/identity/test_participant_02_private_key.pem'
        },

        {
          name: 'dds.sec.access.permissions',
          value: 'file:' + '../security/permissions_2_signed.p7s'
        }
      ]
    }
  });
  console.log('participant created');

  // Handle exit gracefully
  const self = this;
  if (!this.processInitialized) {
    this.processInitialized = true;
    process.on('SIGINT', function() {
      console.log('OnSIGINT');
      self.finalizeDds();
      process.exit(0);
    });
    process.on('SIGTERM', function() {
      console.log('OnSIGTERM');
      self.finalizeDds();
      process.exit(0);
    });
    process.on('exit', function() {
      console.log('OnExit');
      self.finalizeDds();
    });
  }
};

ValveDataReader.prototype.initializeDds = function(configFile) {
  console.log('initializing factory');
  this.factory = opendds.initialize('-DCPSConfigFile', configFile);
  console.log('factory initialized');

  console.log('loading Nexmatix libraries');
  this.library = opendds.load(path.join('..', 'lib', 'Nexmatix'));
  if (!this.library) {
    throw new Error('Could not open type support library');
  }
  console.log('loaded libraries');
};

module.exports = ValveDataReader;
