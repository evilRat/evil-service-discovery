var redis = require("redis");

var redisCli = redis.createClient('6379', '127.0.0.1');

var elements = [{ "key": "1", "value": "a" }, { "key": "2", "value": "b" }, { "key": "3", "value": "c" }, { "key": "4", "value": "d" }];

elements.forEach(element => {
    redisCli.set(element.key, element.value);
});
