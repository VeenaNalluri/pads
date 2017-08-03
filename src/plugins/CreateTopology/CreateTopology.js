/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Fri Feb 03 2017 15:27:19 GMT+0000 (UTC).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'common/util/ejs',
    'pads_app/modelLoader',
    'q',
    'CreateTopology/Templates/Templates',

], function (PluginConfig,
             pluginMetadata,
             PluginBase,
             ejs,
             loader,
             Q,
             TEMPLATES) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of CreateTopology.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin CreateTopology.
     * @constructor
     */
    var CreateTopology = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    CreateTopology.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    CreateTopology.prototype = Object.create(PluginBase.prototype);
    CreateTopology.prototype.constructor = CreateTopology;


    CreateTopology.prototype.notify = function (level, msg) {
        var self = this;
        var prefix = self.projectId + '::' + self.projectName + '::' + level + '::';
        var max_msg_len = 100;
        if (level == 'error')
            self.logger.error(msg);
        else if (level == 'debug')
            self.logger.debug(msg);
        else if (level == 'info')
            self.logger.info(msg);
        else if (level == 'warning')
            self.logger.warn(msg);
        self.createMessage(self.activeNode, msg, level);
        if (msg.length < max_msg_len)
            self.sendNotification(prefix + msg);
        else {
            var splitMsgs = utils.chunkString(msg, max_msg_len);
            splitMsgs.map(function (splitMsg) {
                self.sendNotification(prefix + splitMsg);
            });
        }
    };



    CreateTopology.prototype.convertNode = function (node) {
        var attrs = this.core.getAttributeNames(node);
        // TODO
        if (!this.core.getBaseType(node)) debugger;
        // console.log('node is', node)
        return {
            name: this.core.getAttribute(node, 'name'),
            type: this.core.getAttribute(this.core.getBaseType(node), 'name')
        };
    };

    CreateTopology.prototype.generateDataModel = function (modelNode) {
        var self = this,
            //deferred = new Q.defer(),
            dataModel = {}

        return self.core.loadSubTree(modelNode)
            .then(function (nodes) {
                // Convert the nodes to the desired structure for the template
                // TODO
                return nodes.map(function (node) {
                    return self.convertNode(node);
                });
            });
    };


    CreateTopology.prototype.generateFiles = function (nodes) {
        console.log('generating files...')
        console.log(nodes)
        // Use the datamodel to generate any artifacts from templates
        // TODO
        return '';
    };

    CreateTopology.prototype.generateArtifacts = function() {

        var self = this,
            filesToAdd = {},
            deferred = new Q.defer(),

            artifact = self.blobClient.createArtifact('GeneratedFiles');

            filesToAdd['metadata.json'] = JSON.stringify({
                timeStamp: (new Date()).toISOString(),
            }, null, 2);

            filesToAdd['topology.py'] = self.topologyFileData;

            filesToAdd['command.txt'] = self.commandFileData


        artifact.addFiles(filesToAdd, function (err) {
                if (err) {
                    deferred.reject(new Error(err));
                    return;
                }
                self.blobClient.saveAllArtifacts(function (err, hashes) {
                    if (err) {
                        deferred.reject(new Error(err));
                        return;
                    }

                    self.result.addArtifact(hashes[0]);
                    deferred.resolve();
                });
            });

            return deferred.promise;

    };

    CreateTopology.prototype.renderTopology = function () {
        // render docker compose file with federate type + shared folder name + command

        //type = PubSubNetwork
        var self = this;




        self.nodeLink_listInfo = []
        if(self.pads_datamodel.SwitchSwitchConnection_list){
            self.pads_datamodel.SwitchSwitchConnection_list.map((m_switchlink) => {
                self.nodeLink_listInfo.push({
                    name: m_switchlink.name,
                    type: m_switchlink.type,
                    src_name: m_switchlink.src.name,
                    dst_name: m_switchlink.dst.name,
                    Bandwidth_Mbps: m_switchlink.Bandwidth_Mbps,
                    Delay_ms:m_switchlink.Delay_ms,
                    Loss:m_switchlink.Loss


                })
            })
        }

        if(self.pads_datamodel.HostSwitchConnection_list){
            self.pads_datamodel.HostSwitchConnection_list.map((m_hostswitchlink) => {
                self.nodeLink_listInfo.push({
                    name: m_hostswitchlink.name,
                    type: m_hostswitchlink.type,
                    src_name: m_hostswitchlink.src.name,
                    dst_name: m_hostswitchlink.dst.name,
                    Bandwidth_Mbps: m_hostswitchlink.Bandwidth_Mbps,
                    Delay_ms:m_hostswitchlink.Delay_ms,
                    Loss:m_hostswitchlink.Loss
                })
            })
        }


        self.AppHostList = {};

        self.hostInfo = [];
        if(self.pads_datamodel.Host_list){
            self.pads_datamodel.Host_list.map((m_host) => {
                self.hostInfo.push({
                    ip_addr:m_host.ip_addr,
                    name: m_host.name,
                    type: m_host.type,
                    app_path: []
                })
            })
        }


        //! Make Sure to Call this after we have a host list
        if(self.pads_datamodel.PubConnection_list){
            self.pads_datamodel.PubConnection_list.map((m_pubLink) => {
                self.AppHostList[m_pubLink.src.path] =m_pubLink.dst.name;
            })
        }

        //! Make Sure to Call this after we have a host list
        if(self.pads_datamodel.BrokerConnection_list){
            self.pads_datamodel.BrokerConnection_list.map((m_brokLink) => {
                self.AppHostList[m_brokLink.src.path] =m_brokLink.dst.name;
            })
        }


        //! Make Sure to Call this after we have a host list
        if(self.pads_datamodel.SubConnection_list){
            self.pads_datamodel.SubConnection_list.map((m_subLink) => {
                self.AppHostList[m_subLink.src.path] = m_subLink.dst.name;
            })
        }

        self.brokerInfo = []
        if(self.pads_datamodel.BrokerApp_list){
            self.pads_datamodel.BrokerApp_list.map((m_broker) => {
                self.brokerInfo.push({
                    instances:m_broker.instances,
                    name: m_broker.name,
                    type: m_broker.type,
                    path:m_broker.path,
                    scriptName: m_broker.FileName,
                    args: m_broker.args
                })
            })
        }
        self.publisherInfo = []
        if(self.pads_datamodel.PublisherApp_list){
            self.pads_datamodel.PublisherApp_list.map((m_pub) => {
                self.publisherInfo.push({
                    instances:m_pub.instances,
                    name: m_pub.name,
                    type: m_pub.type,
                    path: m_pub.path,
                    scriptName: m_pub.FileName,
                    args: m_pub.args
                })
            })
        }


        self.subscriberInfo = []
        if(self.pads_datamodel.SubsriberApp_list){
            self.pads_datamodel.SubsriberApp_list.map((m_sub) => {
                self.subscriberInfo.push({
                    instances:m_sub.instances,
                    name: m_sub.name,
                    type:m_sub.type,
                    path: m_sub.path,
                    scriptName: m_sub.FileName,
                    args: m_sub.args,

                })
            })
        }
        self.switchInfo = [];
        if(self.pads_datamodel.SwitchS_list){
            self.pads_datamodel.SwitchS_list.map((m_switch) => {
                self.switchInfo.push({
                    name: m_switch.name,
                    type: m_switch.type
                })
            })
        }


        self.topologyFileData = ejs.render(
            TEMPLATES['topologyFileTemplate.ejs'],
            {
                hostInfo: self.hostInfo,
                switchInfo: self.switchInfo,
                brokerInfo: self.brokerInfo,
                publisherInfo : self.publisherInfo,
                subscriberInfo: self.subscriberInfo,
                nodeLink_listInfo: self.nodeLink_listInfo

            }
        );

        self.commandFileData = ejs.render(
            TEMPLATES['commandFileTemplate.ejs'],
            {
                hostInfo: self.hostInfo,
                switchInfo: self.switchInfo,
                brokerInfo: self.brokerInfo,
                publisherInfo : self.publisherInfo,
                subscriberInfo: self.subscriberInfo,
                nodeLink_listInfo: self.nodeLink_listInfo,
                AppHostList: self.AppHostList
            }
        );
        var topowrite = function() {

            var path = require('path'),
                filendir = require('filendir'),
                fileName = 'topology.py'
            var basePath = process.cwd();
            var deferred = Q.defer();
            filendir.writeFile(path.join(basePath, fileName), self.topologyFileData, function(err) {
                if (err){
                    console.error("not able to create the file")
                    deferred.reject(err);
                }
                else{
                    console.log("done writing file to", path.join(basePath,fileName) )
                    deferred.resolve();
                }
            });
            return deferred.promise;
        };

        var commandwrite = function() {

            var path = require('path'),
                filendir = require('filendir'),
                fileName = 'command.txt'
            var basePath = process.cwd();
            var deferred = Q.defer();
            filendir.writeFile(path.join(basePath, fileName), self.commandFileData, function(err) {
                if (err){
                    console.error("not able to create the file")
                    deferred.reject(err);
                }
                else{
                    console.log("done writing file to", path.join(basePath,fileName) )
                    deferred.resolve();
                }
            });
            return deferred.promise;
        };

        return self.commandFileData;
        // return topowrite().then(commandwrite);
    };


    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    CreateTopology.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            nodeObject;


        // if (typeof WebGMEGlobal !== 'undefined') {
        //     var msg = 'You must run this plugin on the server!';
        //     self.notify('error', msg);
        //     callback(new Error(msg), self.result);
        // }

        // Using the coreAPI to make changes.
        // nodeObject = self.activeNode;

        var currentConfig = self.getCurrentConfig();

        self.projectName = self.core.getAttribute(self.rootNode, 'name');
        var modelNode = self.activeNode;
        self.modelName = self.core.getAttribute(modelNode, 'name');

        // self.generateDataModel(self.activeNode)  // Convert subtree to template-friendly format
        //     .then(function (dataModel) {
        //         self.logger.info('Converted subtree to temp[late-friendcly forfamat');
        //         self.logger.info(JSON.stringify(dataModel, null, 4));
        //         return self.generateFiles(dataModel);
        //     })
        //     .then(function () {
        //         // TODO: Add the files as an artifact
        //         self.result.setSuccess(true);
        //         callback(null, self.result);
        //     })
        //     .catch(function (err) {
        //         self.logger.error(err);
        //         self.createMessage(null, err.message, 'error');
        //         self.result.setSuccess(false);
        //         callback(null, self.result);
        //     })
        //     .done();


        return loader.loadModel(self.core, modelNode)
            .then(function (pads_datamodel) {
                console.log(pads_datamodel)
                self.pads_datamodel = pads_datamodel;
            })
            .then(function() {
                return self.renderTopology();
            })
            .then(function() {
                return self.generateArtifacts();
            })
            .then(function () {
                self.result.success = true;
                self.notify('info', 'Simulation Complete.');
                callback(null, self.result);
            })
            .catch(function (err) {
                self.notify('error', err);
                self.result.success = false;
                callback(err, self.result);
            });
    };

    return CreateTopology;
})
;
