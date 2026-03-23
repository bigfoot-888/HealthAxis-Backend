const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClinicalDocument = sequelize.define('ClinicalDocument', {
    title: {type: DataTypes.STRING(100), allowNull: false},
    // PROGRESS_NOTE: nota de progreso de paciente
    // CONSULT_NOTE: cuando por ejemplo, un médico general explica la situación actual y remite a otro especialista
    documentType: {
        type: DataTypes.ENUM('CLINICAL_SUMMARY', 'PROGRESS_NOTE', 'CONSULT_NOTE', 'EXTERNAL_FILE', 'OTHER'),
        allowNull: false,
        defaultValue: 'OTHER'
    },
    content: {
        type: DataTypes.JSONB,
        allowNull: true,
    },
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
    state: {type: DataTypes.ENUM("DRAFTED", "FINAL", "AMENDED", "ARCHIVED", "VOID"), allowNull: false, defaultValue: "DRAFTED"}
});

const ClinicalDocumentEntity = sequelize.define('ClinicalDocumentEntity', {
    entityType: {
        type: DataTypes.ENUM('DIAGNOSIS', 'TREATMENT', "APPOINTMENT"),
        allowNull: false,
    },
    // The state of the clinical document entity depends on the state of the instance of the entity it references
});

const ClinicalAttachment = sequelize.define('ClinicalAttachment', {
    fileName: { type: DataTypes.STRING(100), allowNull: false },
    storageKey: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
    mimeType: { type: DataTypes.STRING(50), allowNull: false },
    fileSize: { type: DataTypes.BIGINT, allowNull: false },
    state: {type: DataTypes.ENUM("ACTIVE", "INACTIVE", "DELETED"), defaultValue: 'ACTIVE', allowNull: false}
});

const ClinicalDocumentUser = sequelize.define('ClinicalDocumentUser', {
    role: {
        type: DataTypes.ENUM('AUTHOR', 'REVIEWER', 'VALIDATOR', 'CONTRIBUTOR', 'UPLOADER'),
        allowNull: false,
        defaultValue: 'UPLOADER',
    }
});

module.exports = {
    ClinicalDocument,
    ClinicalDocumentEntity,
    ClinicalAttachment,
    ClinicalDocumentUser
};

