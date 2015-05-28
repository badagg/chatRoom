(function(){
	/*导入WS服务包*/
	var webSocketServer = require("ws").Server;
	
	/*实例化一个socket服务 并设置端口号*/
	var wss = wss ? wss : new webSocketServer({port:1314});
	
	/*创建客户端组*/
	var wsGroup = [];
	var userGroup = [];
	
	/*与客户端通讯的标示*/
	var marked = {
		key0:"用户进入",
		key1:"发送消息"
	}
	
	/*客户端访问个数计数*/
	var total = 0;
	
	/*监听socket实例*/
	wss.on("connection",function(ws){
		/*当客户端发送消息时*/
		ws.on("message",function(message){
			var msg = JSON.parse(message);
			/*新成员进入*/
			if(msg["key"] == marked.key0){
				total++;
				msg["data"]["uid"] = total;
				ws.user = msg["data"];
				ws.uid = total;
				wsGroup.push(ws);
				userGroup.push(msg["data"]);
				noticeAll({
					key:marked.key0,
					group:userGroup,
					total:total
				})
			}
			/*新聊天*/
			if(msg["key"] == marked.key1){
				if(msg["uid"] == "qun"){
					wsGroup.forEach(function(o,i){
						if(o.uid != msg["mid"]){
							o.send(JSON.stringify({
								key:marked.key1,
								uid:"qun",
								msg:msg["msg"],
								name:ws.user["name"],
								time:tools.getTime()
							}));
						}
					})
				}else{
					var my = {};
					wsGroup.forEach(function(o,i){
						if(o.uid==msg["mid"]){
							my= o.user;
						}
					})
					wsGroup.forEach(function(o,i){
						if(o.uid == msg["uid"]){
							o.send(JSON.stringify({
								key:marked.key1,
								uid:msg["uid"],
								msg:msg["msg"],
								user:my,
								name:ws.user["name"],
								time:tools.getTime()
							}));
						}
					})
				}
			}
		})
		
		/*当客户端断开连接时*/
		ws.on("close",function(){
			tools.removeElem(wsGroup,ws);
			tools.removeElem(userGroup,ws.user);
			noticeAll({
				key:marked.key0,
				group:userGroup,
				total:total
			})
		})
	})
	
	/*通知所有ws 更新消息*/
	var noticeAll = function(data){
		wsGroup.forEach(function(o,i){
			o.send(JSON.stringify(data));
		})
	}
	
	
	
	/*工具类*/
	var tools = {
		/*剔除指定数组元素*/
		removeElem:function(a,e){
			if(a.indexOf(e) != -1){
				var id = a.indexOf(e);
				a.splice(id,1);
			}
		},
		/*补0*/
		fill:function(num){
			var str = num+"";
			if(num < 10)str = "0" + num;
			return str;
		},
		/*获取年月日时分秒 如：2014-6-25 17:55:32*/
		getTime:function(){
			var dt = new Date();
			var str = dt.getFullYear()+"/"+
				this.fill(Number(dt.getMonth()+1))+"/"+
				this.fill(dt.getDate())+""+
				this.fill(dt.getHours())+":"+
				this.fill(dt.getMinutes())+":"+
				this.fill(dt.getSeconds());
			return str;
		}
	}
	
})();