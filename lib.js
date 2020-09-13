var fs = require('fs');
var Mustache = require('mustache');
var async = require('async');
var zendesk = require('node-zendesk');


var client = zendesk.createClient({
    username: '',
    token: '',
    remoteUri: 'https://cloudinary.zendesk.com/api/v2',
});
 

function updateSignatureForAllAgents(signatureFileName) {
 
    listAllAgents(function (agents) {

        agents.forEach(agent => {
            updateAgentWithNewSignature(agent, generateNewSignature(agent.signature, signatureFileName));
          });

    })

}

function generateNewSignature(CurrentSignature, signatureFileName) {

    var newDyamincSignature = fs.readFileSync(signatureFileName, 'utf8');

    var lines = CurrentSignature.split('\n');
    var agentPrivateSignature = "";

    /*
    All agents can add his own private signatire in the first 3 lines.
   The provate signature can not include :
   ___
   ---
   __
   ----
   ##
   ###
   ####
 
   This is a must to support agents that do not have private signature
    */


    for (var i = 0; i <= 2; i++) {
        if (lines[i] &&
            lines[i] != "" &&
            lines[i].indexOf("___") < 0 &&
            lines[i].indexOf("---") < 0 &&
            lines[i].indexOf("__") < 0 &&
            lines[i].indexOf("----") < 0 &&
            lines[i].indexOf("##") < 0 &&
            lines[i].indexOf("####") < 0 &&
            lines[i].indexOf("###") < 0) {
            agentPrivateSignature += lines[i] + "\n";
        }
    }
    var newSignature = newDyamincSignature;
    if (agentPrivateSignature != "") {
        agentPrivateSignature += '\n'
        newSignature = agentPrivateSignature + newDyamincSignature;
    }
    

    return newSignature;

}

function updateAgentWithNewSignature(agent, signature) {
   

    agent.signature = Mustache.render(signature, agent);
     var newData = {
        "user": agent
    };
 
    
    
    client.users.update(agent.id, newData, function (err, req, data) {
        console.log(agent.name, req)
    });
   
 
}

function listAllAgents(cb) {
    var g = [];
    var r = [];
    async.map(g, list, function (err, results) {
         for (i = 0; i < results.length; i++) {

            r = r.concat(results[i]);

        }
        return cb(r)

    });


}

function list(data, cb) {
    client.users.listByGroup(data, function (err, req, data) {
  
        return cb(null, data)
    })
}



module.exports = {
    listAllAgents,
    updateSignatureForAllAgents,
    restore
};