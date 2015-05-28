(function(){
	/*用户信息*/
	var userInfo = {
		name:"游客"+Math.floor(Math.random()*100),
		face:"public/images/face/f"+Math.floor(Math.random()*32)+".jpg"
	};
	
	var start = function(){
		/*与服务端通讯的标示*/
		var marked = {
			key0:"用户进入",
			key1:"发送消息"
		}
	
		/*链接websocket服务器*/
		var socket = new WebSocket('ws://192.168.117.69:1314');
		socket.onopen = function(event){
			console.log(event)
			addNewUser();
			sendMsg();
		}
		socket.onmessage = function(event){
			var msg = JSON.parse(event.data);
			if(msg["key"] == marked.key0){
				console.info(msg["group"]);
				updataUserList(msg["group"],msg["total"]);
			}
			if(msg["key"] == marked.key1){
				if(msg["uid"] != "qun"){
                    isNotice(msg);
				}
				updataChat(msg);
			}
		}
		socket.onclose = function(event){
			console.log("websocket is close!!!");
		}
		
		/*新用户连接*/
		var addNewUser = function(){
			socket.send(JSON.stringify({
				key	:marked.key0,
				data:userInfo
			}));
			bindUserList();
			switchChatWin();
		}
		
		/*聊天内容处理*/
		var msgHandle = function(){
			var msg = dom.ta.val();
			if(msg){
				if(tools.filterString(msg)){
					socket.send(JSON.stringify({
						key:marked.key1,
						uid:currentUid,
						mid:mid,
						msg:msg
					}));
					updataSelfChat({
						name:userInfo.name,
						msg:msg,
						time:tools.getTime()
					});
				}else{
					alert("说的太深奥，大家肯定听不懂，这句就不发了！");
				}
			}else{
				alert("总得说点什么吧！");
			}
			dom.ta.val("").focus();
		}
		
		/*发送聊天*/
		var sendMsg = function(){
			dom.btnSend.click(function(){
				msgHandle();
			})
			$(document).keydown(function(e){ 
				if(e.keyCode == "13" && dom.ta.is(":focus")){
					msgHandle();
					return false;
				} 
			})
		}
		
	}
	
	/*获取Dom元素*/
	var dom = {
		tabsBox:$("#tabsBox"),
		userBox:$("#userBox"),
		counter:$("#counter"),
		msgBox:$("#msgBox"),
		ta:$("#ta"),
		btnSend:$("#btnSend"),
		msgNotice:$("#msgNotice")
	}
	/*DOM模板*/
	var templet = {
		userList : ["<li class='item' uid='{uid}' face='{face}' name='{name}'>",
						"<img class='face' src='{face}' />",
						"<span class='name'>{name}</span>",
						"</li>"].join("")
		,chatList : ["<div class='item'>",
						"<p class='p1'>",
						"<em class='name'>{name}</em>",
						"<em class='time'>{time}</em></p>",
						"<p class='p2'>{msg}</p>",
						"</div>"].join("")
		,userTabs : ["<li class='item on' data-key='{uid}'>",
						"<img class='face' src='{face}' />",
						"<span class='name'>{name}</span>",
						"<a href='javascript:;' class='close'></a>",
						"</li>"].join("")
		,chatWin : "<div class='msg_box on' data-key={uid}></div>"
		,notice : "<span class='item' data-key='{uid}' name='{name}'><img src='{face}'/></span>"
	}
	/*当前聊天对象*/
	var currentUid = "qun";
	/*自己*/
	var mid = null,isid = true;
		
	/*刷新在线成员列表*/
	var updataUserList = function(data,num){
		/*记录自己的ID*/
		if(isid) {
			mid = num;
			isid = false;
		}
		
		dom.userBox.html("");
		dom.counter.text(data.length+"/"+num);
		for(var i=0;i<data.length;i++){
			var html = tools.substitute(templet.userList,data[i]);
			//$(html).appendTo(dom.userBox);
			dom.userBox.append(html);
		}
	}
	/*刷新聊天纪律*/
	var updataChat = function(data){
		var html = tools.substitute(templet.chatList,data);
        var curWin = dom.tabsBox.find(".item[data-key="+data.uid+"]");
        if(!curWin.hasClass("on")) curWin.addClass("activa");
		dom.msgBox.find(".msg_box[data-key="+data.uid+"]").append(html).scrollTop(99999);
	}
	/*更新自己的聊天记录*/
	var updataSelfChat = function(data){
		var html = tools.substitute(templet.chatList,data);
		dom.msgBox.find(".on").append(html).scrollTop(99999);
	}
	
	/*给用户列表绑定事件*/
	var bindUserList = function(){
		dom.userBox.delegate(".item","dblclick",function(){
			var uid = $(this).attr("uid");
			if(uid != mid){
				createChatWin({
					uid:uid,
					name:$(this).attr("name"),
					face:$(this).attr("face")
				});
				var the = dom.msgNotice.find(".item[data-key="+uid+"]")
				if(the.length > 0){
					upataWin($(the)[0]);
					removeNots($(the)[0]);
				}
			}else{
				alert("自己和自己说话 是孬子！");	
			}
		})
	}
	/*聊天窗口切换*/
	var switchChatWin = function(){
		dom.tabsBox.delegate(".item","click",function(e){
			var uid = $(this).attr("data-key");
			$(this).addClass("on").siblings(".item").removeClass("on").removeClass("activa");
			dom.msgBox.find(".msg_box[data-key="+uid+"]").addClass("on").siblings(".msg_box").removeClass("on");
			currentUid = uid+"";
			/*删除聊天选项卡以及对话框*/
			if($(e.target).hasClass("close")){
				var id = $(e.target).parent().attr("data-key");
				dom.msgBox.find(".msg_box[data-key="+id+"]").remove();
				dom.tabsBox.find(".item[data-key="+id+"]").remove();
				dom.tabsBox.find(".item[data-key=qun]").addClass("on");
				dom.msgBox.find(".msg_box[data-key=qun]").addClass("on");
			}
		})
	}
	
	
	/*创建聊天窗口*/
	var createChatWin = function(data){
		if(dom.tabsBox.find(".item[data-key="+data.uid+"]").length > 0) return false;
		//创建tab
		var tabHtml = tools.substitute(templet.userTabs,data);
		dom.tabsBox.find(".item").removeClass("on");
		//$(tabHtml).appendTo(dom.tabsBox)
		dom.tabsBox.append(tabHtml);
		//创建窗口
		var winHtml = tools.substitute(templet.chatWin,data);
		dom.msgBox.find(".msg_box").removeClass("on");
		dom.msgBox.append(winHtml);
		currentUid = data.uid + "";
	}
    /*判断是否创建提示*/
    var isNotice = function(msg){
        var curWin = dom.tabsBox.find(".item[data-key="+msg["user"].uid+"]");
        if(curWin.length > 0){
            updataChat({
                name:msg["name"],
                msg:msg["msg"],
                uid:msg["user"].uid,
                time:msg["time"]
            })
        }else{
            addNotice(msg);
        }
    }
	/*新增消息提示*/
	var addNotice = function(msg){
        var data = msg["user"];
        if(dom.msgNotice.find(".item[data-key="+data.uid+"]").length <= 0){
            var html = tools.substitute(templet.notice,data);
            $(html).appendTo(dom.msgNotice).click(function(){
                createChatWin({
                    uid:msg["user"].uid,
                    name:msg["user"].name,
                    face:msg["user"].face
                });
				
                upataWin(this);
				removeNots(this);
            }).css({"margin-top":30,"opacity":0}).animate({"margin-top":0,"opacity":1});
        }
		var notFace = dom.msgNotice.find(".item[data-key="+data.uid+"]");
		if($(notFace)[0].msg){
			$(notFace)[0].msg.push(msg);
		}else{
			$(notFace)[0].msg = [];
			$(notFace)[0].msg.push(msg);
		}
	}
	/*更新窗口多内容*/
	var upataWin = function(e){
		for(var i=0; i<e.msg.length;i++){
			var fd = e.msg[i];
			updataChat({
				name:fd.name,
				msg:fd.msg,
				uid:fd.user.uid,
				time:fd.time
			})
		}
	}
	/*移除指定消息*/
	var removeNots = function(e){
		delete e.msg;
		$(e).animate({"margin-top":30,"opacity":0});
		setTimeout(function(){
			$(e).remove();
		},500)
	}
	
	
	/*进入 选择头像 取名字*/
	var entrance = function(){
		var box = $(".face_box");
		var path = "images/face/";
		var num = 35;
		var tw = $(window).width();
		var th = $(window).height();
		var ranNumber = function(n1, n2) {
			return Math.floor(Math.random() * (n2 - n1 + 1) + n1);
		}
		for(var i=0; i<num-1;i++){
			var url = path+"f"+i+".jpg";
			var html = "<span class='item'><img src="+url+" /></span>";
			var ranX = ranNumber(10,tw-150);
			var ranY = ranNumber(10,th-30);
			var ranT = Math.random()*1500;
			$(html).appendTo(box).css({"left":ranX,"top":ranY,"opacity":0}).delay(ranT).animate({"opacity":1});
		}
		var ipt_text = "<span><input type='text' placeholder='输入大名'><a href='javascript:;'>进入</a></span>";
		box.find(".item").on("click",function(){
			var that = this;
			$(this).append(ipt_text).addClass("cur on").siblings(".item").each(function(i,e){
				var ran = Math.random()*1000;
				$(e).delay(ran).animate({"opacity":0});
				setTimeout(function(){
					$(e).remove();
				},2000)
			})
			var x = ($(window).width() - 160) / 2;
			var y = ($(window).height() - 30) / 2;
			$(that).animate({"left":x,"top":y});
			$(that).unbind("click").find("a").click(function(){
				var ipt = $(that).find("input");
				var name = ipt.val();
				if(name){
					if(tools.filterString(name)){
						$(that).removeClass("cur").animate({
							left:($(window).width()-30)/2,
							top:($(window).height()-30)/2
						});
						setTimeout(function(){
							$(that).addClass("rt");
							setTimeout(function(){
								$(that).remove();
								viewChatRoom();
							},500)
						},1000)
						/*设置用户信息*/
						userInfo.name = name;
						userInfo.face = $(that).find("img").attr("src");
						//console.info(userInfo);
					}else{
						alert("名字太霸气了，重新取一个吧！");
						ipt.val("").focus();
					}
				}else{
					alert("取名字一个霸气的名字吧！");
				}
				
			})
		})
	}
	/*显示聊天界面*/
	var viewChatRoom = function(){
		var self = $(".chatroom");
		self.addClass("view");
		/*链接服务器*/
		start();
	}
	//viewChatRoom();
	
	/*工具类*/
	var tools = {
		/*防止注入*/
		filterString:function(str){
			var re=/select|update|delete|truncate|join|union|exec|insert|drop|count|’|"|;|>|<|%/i;
			return re.test(str) ? false : true;
		},
		/*模板替换*/
		substitute:function(str,object){
			return str.replace(/\\?\{([^}]+)\}/g, function(match, name){
				if (match.charAt(0) == '\\') return match.slice(1);
				return (object[name] != undefined) ? object[name] : '';
			});	
		},
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
	
	
	/*构造*/
	var main = function(){
		entrance();
	}();
})();
