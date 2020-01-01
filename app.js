var express = require('express');
var zookeeper = require('node-zookeeper-client')
var httpProxy = require('http-proxy')

var PORT = 1234;

//var CONNECTION_STRING = '127.0.0.1:2181,127.0.0.1:2182,127.0.0.1:2183'
var CONNECTION_STRING = '127.0.0.1:2181'

var REGISTRY_ROOT = '/registry';

var serviceAddress;

//连接zk
var zk = zookeeper.createClient(CONNECTION_STRING);
zk.connect();

//服务地址缓存
var cache = {};

//创建代理服务器对象并监听错误事件
var proxy = httpProxy.createProxyServer();
proxy.on('error', function (err, req, res) {
    res.end();
});

//启动Web服务器
var app = express();
app.use(express.static('public'));
app.all('*', function (req, res) {
    //处理图标请求
    if (req.path == '/favicon.ico') {
        res.end();
        return;
    }
    //获取服务名称
    var serviceName = req.get('Service-Name');
    console.log('serviceName: %s', serviceName);
    if (!serviceName) {
        console.log('Service-Name request header is not exist');
        res.end();
        return;
    }
    //如果缓存里有数据
    if (cache[serviceName]) {
        serviceAddress = cache[serviceName];
        console.log("serviceAddress from cache: %s", serviceAddress);
        //执行反向代理
        proxy.web(req, res, {
            target: 'http://' + serviceAddress
        });
    } else {
        //获取服务路径
        var servicePath = REGISTRY_ROOT + '/' + serviceName;
        console.log('servicePath: %s', servicePath);
        zk.getChildren(servicePath, function (error, addressNodes) {
            if (error) {
                console.log(error.stack);
                res.end();
                return;
            }
            var size = addressNodes.length;
            console.log('addressNodes size: %d', size);
            if (size == 0) {
                console.log('address node is not exist');
                res.end();
                return;
            }
            //生成地址路径
            var addressPath = servicePath + '/';
            if (size == 1) {
                //只有一个地址
                addressPath += addressNodes[0];
            } else {
                //存在多个地址，随机获取一个
                addressPath += addressNodes[parseInt(Math.random() * size)];
            }
            console.log('addressPath: %s', addressPath);
            //获取服务地址
            zk.getData(addressPath, function (error, serviceAddress) {
                if (error) {
                    console.log(error.stack);
                    res.end();
                    return;
                }
                console.log('serviceAddress: %s', serviceAddress.toString());
                if (!serviceAddress) {
                    console.log('service address is not exist');
                    res.end();
                    return;
                }
                //缓存服务地址
                cache[serviceName] = serviceAddress;
                //执行反向代理
                proxy.web(req, res, {
                    target: 'http://' + serviceAddress
                });
            });
        });
    }
});

app.listen(PORT, function () {
    console.log('Service Discovery is running at %d', PORT);
})