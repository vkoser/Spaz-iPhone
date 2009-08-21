function getFavorites() {
	
	$("#fcontainer").empty();
	// Activity Indicator
	var ind = Titanium.UI.createActivityIndicator({
		id:'indicator',
		style:Titanium.UI.iPhone.ActivityIndicatorStyle.BIG,
		color:'#fff'
	});
	ind.setMessage('Loading...');
	ind.show();
	var loggedIn = props.getBool('loggedIn');
	if (loggedIn == true) {
		var name = props.getString('username');
		var pass = props.getString('password');
		var client = props.getInt('clientMode');
		var cache = db.execute("SELECT FAVORITES FROM ACCOUNTS WHERE ACCOUNT='"+name+"'").field(0);
		if (cache != '') {
			ind.hide();
			$("#fcontainer").html(cache);
		}
		var request = '';
		if (client == 0) {
			request = "http://"+name+":"+pass+"@twitter.com/favorites.json";
		} else {
			request = "http://"+name+":"+pass+"@identi.ca/api/favorites.json";
		}
		var xhr = Titanium.Network.createHTTPClient();
		xhr.onload = function() {
			var data = JSON.parse(this.responseText);
			var text = '';
			var count = 0;
			var link = /(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w\.-]*)[\w\/]/gi;
			var mention = /@\w{1,15}/gi;
			$.each(data, function(i,tweet){
				text += "<div id='" +
					tweet.id +
				"' class='status' style='background-image:url(\"";
				if (tweet.user.screen_name == props.getString('username')) {
					if (loggedIn == true) {
						{text += "images/BG_red_sliver.png";}
					}
				}
				else if (count % 2 == 0) {text += "images/BG_dark_sliver.png";}
				else if (count % 2 == 1) {text += "images/BG_light_sliver.png";}
				text += "\");'><img src='" +
					tweet.user.profile_image_url +
				"' class='usrimg'/><div class='usrname'>" +
					tweet.user.screen_name +
				"</div><div class='usrtime'>" +
					humane_date(tweet.created_at) +
				"</div><div class='usrmsg'>" +
					tweet.text.replace(link, function(exp) {
							return ("<lnk>"+exp+"</lnk>");
						}).replace(mention, function(exp) {
							return ("<usr>"+exp+"</usr>");
						}) +
				"</div></div>";
				count++;
			});
			ind.hide();
			$("#fcontainer").html(text);
			db.execute("UPDATE ACCOUNTS SET FAVORITES=? WHERE ACCOUNT='"+name+"'",text);
			//User detail
			$(".usrimg").bind('click',function(e){
				//Set user screenname global
				props.setString('screenname',$(this).siblings(".usrname").text());
				Titanium.UI.createWindow({
					url:'user.html',
					barColor:'#423721',
				}).open();
			});
			//Message detail
			$(".usrmsg").bind('click',function(e){
				//Set message ID global
				props.setString('msgID',$(this).parent(".status").attr("id"));
				props.setBool('isFavorite',true);
				Titanium.UI.createWindow({
					url:'message.html',
					barColor:'#423721',
				}).open();
			});
			//Links
			$("lnk").bind('click',function(e){
				Titanium.Platform.openURL($(this).text());
				e.stopPropagation();
				return false;
			});
			//Mentions
			$("usr").bind('click',function(e){
				e.stopPropagation();
				//Set user ID global
				props.setString('screenname',$(this).text().substring(1));
				//User detail view
				Titanium.UI.createWindow({
					url:'user.html',
					barColor:'#423721',
				}).open();
				return false;
			});
		}
		xhr.open("GET",request);
		xhr.send();
	}
	else {
		ind.hide();
		$("#fcontainer").html("<div class='header'>Must be logged in.</div>");
	}
};


window.onload = function() {
	
	// Initialize
	props = Titanium.App.Properties;
	db = Titanium.Database.open('fake');
	db.close();
	db._TOKEN = props.getString('dbtoken');
	
	getFavorites();
		
	// Refresh page on focus
	Titanium.UI.currentWindow.addEventListener('focused',function(){
		getFavorites();
	});
	
	// Titanium.UI.currentWindow.addEventListener('unfocused',function(){
	// 	db.close();
	// });
	
};