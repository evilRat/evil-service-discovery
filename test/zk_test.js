var zookeeper = require('node-zookeeper-client');

var zk = zookeeper.createClient("127.0.0.1:2181");
console.log('###############')

zk.getChildren('/registry/HelloService', null, function (error, children, stat) {
    console.log('----------------')
    if(error) {
        console.log(error.stack);
    } else {
        console.log(children);
    }
})