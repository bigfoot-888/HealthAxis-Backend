const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClinicalDocument = sequelize.define(
    'ClinicalDocument',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
        },
        title: { type: DataTypes.STRING(100), allowNull: false },
        documentType: {
            type: DataTypes.ENUM('CLINICAL_SUMMARY', 'PROGRESS_NOTE', 'CONSULT_NOTE', 'EXTERNAL_FILE', 'OTHER'),
            allowNull: false,
            defaultValue: 'OTHER',
        },
        content: {
            type: DataTypes.JSONB,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('DRAFTED', 'FINAL', 'AMENDED', 'ARCHIVED', 'VOID'),
            allowNull: false,
            defaultValue: 'DRAFTED',
        },
    },
    {
        tableName: 'ClinicalDocuments',
        timestamps: true,
    },
);

const ClinicalDocumentEntity = sequelize.define(
    'ClinicalDocumentEntity',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        entityId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        entityType: {
            type: DataTypes.ENUM('DIAGNOSIS', 'TREATMENT', 'APPOINTMENT'),
            allowNull: false,
        },
    },
    {
        tableName: 'ClinicalDocumentEntities',
        timestamps: true,
    },
);

const ClinicalAttachment = sequelize.define(
    'ClinicalAttachment',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'RESTRICT',
        },
        fileName: { type: DataTypes.STRING(100), allowNull: false },
        storageKey: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false },
        mimeType: { type: DataTypes.STRING(50), allowNull: false },
        fileSize: { type: DataTypes.BIGINT, allowNull: false },
        status: {
            type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'DELETED'),
            defaultValue: 'ACTIVE',
            allowNull: false,
        },
    },
    {
        tableName: 'ClinicalAttachments',
        timestamps: true,
    },
);

const ClinicalDocumentUser = sequelize.define(
    'ClinicalDocumentUser',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        clinicalDocumentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'ClinicalDocuments', key: 'id' },
            onDelete: 'CASCADE',
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'Users', key: 'id' },
            onDelete: 'CASCADE',
        },
        role: {
            type: DataTypes.ENUM('AUTHOR', 'REVIEWER', 'VALIDATOR', 'CONTRIBUTOR', 'UPLOADER'),
            allowNull: false,
            defaultValue: 'UPLOADER',
        },
    },
    {
        tableName: 'ClinicalDocumentUsers',
        timestamps: true,
    },
);

const ClinicalDocumentAndEntity = sequelize.define(
    'ClinicalDocumentAndEntity',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        clinicalDocumentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'ClinicalDocuments', key: 'id' },
            onDelete: 'CASCADE',
        },
        clinicalDocumentEntityId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'ClinicalDocumentEntities', key: 'id' },
            onDelete: 'CASCADE',
        },
    },
    {
        tableName: 'ClinicalDocumentsAndEntities',
        timestamps: true,
    },
);

const ClinicalDocumentAndAttachment = sequelize.define(
    'ClinicalDocumentAndAttachment',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        clinicalDocumentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'ClinicalDocuments', key: 'id' },
            onDelete: 'CASCADE',
        },
        clinicalAttachmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'ClinicalAttachments', key: 'id' },
            onDelete: 'CASCADE',
        },
    },
    {
        tableName: 'ClinicalDocumentsAndAttachments',
        timestamps: true,
    },
);

module.exports = {
    ClinicalDocument,
    ClinicalDocumentEntity,
    ClinicalAttachment,
    ClinicalDocumentUser,
    ClinicalDocumentAndEntity,
    ClinicalDocumentAndAttachment,
};
