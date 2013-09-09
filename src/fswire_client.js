/**
 * Date.parse with progressive enhancement for ISO 8601 <https://github.com/csnover/js-iso8601>
 * © 2011 Colin Snover <http://zetafleet.com>
 * Released under MIT license.
 */
(function (Date, undefined) {
    var origParse = Date.parse, numericKeys = [ 1, 4, 5, 6, 7, 10, 11 ];
    Date.parse = function (date) {
        var timestamp, struct, minutesOffset = 0;

        if ((struct = /^(\d{4}|[+\-]\d{6})(?:-(\d{2})(?:-(\d{2}))?)?(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(?:(Z)|([+\-])(\d{2})(?::(\d{2}))?)?)?$/.exec(date))) {
            for (var i = 0, k; (k = numericKeys[i]); ++i) {
                struct[k] = +struct[k] || 0;
            }

            // allow undefined days and months
            struct[2] = (+struct[2] || 1) - 1;
            struct[3] = +struct[3] || 1;

            if (struct[8] !== 'Z' && struct[9] !== undefined) {
                minutesOffset = struct[10] * 60 + struct[11];

                if (struct[9] === '+') {
                    minutesOffset = 0 - minutesOffset;
                }
            }

            timestamp = Date.UTC(struct[1], struct[2], struct[3], struct[4], struct[5] + minutesOffset, struct[6], struct[7]);
        }
        else {
            timestamp = origParse ? origParse(date) : NaN;
        }

        return timestamp;
    };
}(Date));
function safeFixed(value, dp) {
    return(null !== value && value !== 'undefined') ? value.toFixed(dp) : 0.00;
}
String.prototype.linkify_tweet = function() {
    var tweet = this.replace(/(^|\s)@(\w+)/g, "$1<a href='http://www.twitter.com/$2' onclick='function(e){e.stopPropagation();}' target='_blank'>@$2</a>");
    return tweet.replace(/(^|\s)[#|$](\w+)/g, "$1<a href='http://search.twitter.com/search?q=%23$2'>#$2</a>");
};
String.prototype.highlight_currency = function() {
    return this.replace(/(^|\s)(\$|£)([\d,.]+)/g, "$1<span class='chat.currency'>$2$3</span>");
};
String.prototype.highlight_room = function() {
    return this.replace(/(^|\s)([#|$])(\w+([.|-]?\w+)*)/g, "$1<a chat-id='$3' command='view-room' class='command'>$2$3</a>");
};
String.prototype.twitterfy_message = function() {
    return this.replace(/(^|\s)@(\w+)/g, "$1<a twitter-screen-name='$2' command='view-twitter-user-profile' class='command'>@$2</a>");
};
String.prototype.chatify_message = function() {
    return this.highlight_currency().twitterfy_message().highlight_currency_pairs().highlight_room();
};

$.fn.hasAttr = function(name) {
    return this.attr(name) !== undefined ;
};
$.fn.addCommand = function(pattern, command, commandDataAttributeName, cssname) {

    var regex = typeof(pattern) === "string" ? new RegExp(pattern, "i") : pattern; // assume very LOOSELY pattern is regexp if not string

    function createActionLink(text, command, commandDataAttributeName, cssname) {
        var link = document.createElement('a');
        link.className = cssname;
        link.innerText = text.textContent;
        link.setAttribute(commandDataAttributeName, text.textContent.replace(/[\$|#|£]/, ''));
        link.setAttribute("command", command);

        return link;
    }
    function addAction(node, pattern, command, commandDataAttributeName, cssname) {
        var skip = 0;
        if (node.nodeType === 3) { // 3 - Text node

            var pos = node.data.search(regex);

            if (pos >= 0 && node.data.length > 0) { // .* matching "" causes infinite loop

                var match = node.data.match(regex);
                var spanNode = document.createElement('a');
                var middleBit = node.splitText(pos);
                var endBit = middleBit.splitText(match[0].length); // similarly split middleBit to 2 nodes
                var middleClone = middleBit.cloneNode(true);

                spanNode.className = cssname;
                spanNode.appendChild(createActionLink(middleClone, command, commandDataAttributeName, cssname));


                // parentNode ie. node, now has 3 nodes by 2 splitText()s, replace the middle with the highlighted spanNode:
                middleBit.parentNode.replaceChild(spanNode, middleBit);

                skip = 1; // skip this middleBit, but still need to check endBit

            }
        } else if (node.nodeType === 1 && node.childNodes && !/(script|style)/i.test(node.tagName)) { // 1 - Element node

            for (var i = 0; i < node.childNodes.length; i++) { // highlight all children
                i += addAction(node.childNodes[i], pattern, command, commandDataAttributeName, cssname); // skip highlighted ones
            }

        }
        return skip;
    }
    return this.each(function() {
        addAction(this, pattern, command, commandDataAttributeName, cssname);
    });
};

var fswire = fswire || {};

function FSwireClient(user_id, unique_id, is_admin, is_cleaner) {

    var self = this;
    this.api_root = '/api/v1';
    this.debug = false;
    this.is_admin = is_admin;
    this.is_cleaner = is_cleaner;
    this.unique_id = unique_id;
    this.current_user = {
        client:this,
        id:user_id,
        build_url:function(action) { return this.client.api_root + '/users/' + this.id.toString() + '/' + action + '?db=' + this.client.unique_id;},
        streams: {
            client:this,
            add:function(id, callback) { var self = this;
                $.getJSON(self.client.current_user.build_url("streams/add"), {id:id}, callback); },
            remove:function(id, callback) { var self = this;
                $.getJSON(self.client.current_user.build_url("streams/remove"), {id:id}, callback);},
            current:function(callback) { var self = this;
                $.getJSON(self.client.current_user.build_url("streams/current"), callback); },
            recent:function(callback) { var self = this;
                $.getJSON(self.client.current_user.build_url("streams/recent"), callback);},
            favourites:function(callback) { var self = this;
                $.getJSON(self.client.current_user.build_url("streams/favourties"), callback);},

            update_order:function(order_room_ids, callback) {var self = this; $.ajax({ type: 'POST', url: self.client.current_user.build_url('streams/update_order'), dataType: "json", data: order_room_ids, success: callback});}
        },
        messages:{
            client:this,
            post:function(message_text) { },
            favourites:function(callback) { var self = this; self.client.current_user.streams.favourites(callback); },
            add_favourite:function(id, callback) { var self = this; $.ajax({ url: self.client.current_user.build_url('messages/favourties/' + id), type: 'post', dataType: 'json', data: '', success:callback}); },
            remove_favourite:function(id, callback) { var self = this; $.ajax({ url: self.client.current_user.build_url('messages/favourties/' + id), type: 'DELETE', dataType: 'json', data: '', success:callback}); }
        }

    };
    this.Messages = {
        client:this,
        remove:function(id, callback) { var self = this;
            if (!self.client.is_admin) return;
            $.ajax({url: self.client.api_root + '/messages/' + id +'/delete', type: 'delete', dataType: 'json', data: '', success: callback});}

    },
    this.Streams = {
        client:this,
        build_url:function(id, action, params) {
            var self = this;
            params = $.extend({days:7, ssi_lag:-4, ssi_volume_ma:10}, params);
            return self.client.api_root + '/streams/' + id.toString() + '/' + action +
                                '?query_day_period='  + params.days.toString() +
                                '&ssi_day_lag=' + params.ssi_lag.toString() +
                                '&ssi_ma_day_range=' + params.ssi_volume_ma.toString() +
                                '&db=' + self.client.unique_id; },
        find_by_id:function(id, callback) { var self = this; $.getJSON(self.client.api_root + "/streams/" + id.toString(), {}, callback); },
        search:function(search_text, callback) { var self = this; $.getJSON(self.client.api_root + "/streams/search", { id:search_text }, callback); },
        support:function(callback) { var self = this; $.getJSON( self.client.api_root + '/streams/support.json', callback); },
        history:function(id, last_id, only_messages_with_urls, callback) {
            var self = this;
            var params = null !== last_id ? {before:last_id, db:self.client.unique_id, urls_only:only_messages_with_urls} : {urls_only:only_messages_with_urls, db:self.client.unique_id};
            $.getJSON( self.client.api_root + '/streams/' + id.toString() +'/history.json', params, callback); },
        sentiment_day_summary_moving_ave:function(id, params, callback){},
        sentiment_day_summary:function(id, params, callback){var self = this; $.getJSON(self.build_url(id, 'sentiment_day_summary', params), callback);},
        volume_day_summary:function(id, params, callback){},
        ssi:function(id, params, callback){var self = this; $.getJSON(self.build_url(id, 'ssi', params), callback);},
        links:function(id, params, callback){},
        price:function(id, params, callback){var self = this; $.getJSON(self.build_url(id, 'price', params), callback); },
        trending_links:function(id, params, callback){}
    };
    this.Search = {
        client:this,
        find:function(search_text, last_timestamp, callback){
            var self = this;
            if(last_timestamp=='')
            	this.SearchLinkRequest=$.getJSON(self.client.api_root + '/search.json?q=' + search_text, callback);
            else {
           		var t=Math.round(Date.parse(last_timestamp) / 1000);
           		this.SearchLinkRequest=$.getJSON(self.client.api_root + '/search.json?q=' + search_text +'&before='+t, callback);
           	}
        }
    };
    this.SearchNewLink = {
        client:this,
        find:function(search_text, new_timestamp, callback){
            var self = this; 
            var t=Math.round(Date.parse(new_timestamp) / 1000);
            this.SearchNewLinkRequest=$.getJSON(self.client.api_root + '/search.json?q=' + search_text +'&after='+t, callback);                        
        }
    };
    this.SearchMessage = {
        client:this,
        find:function(search_text, last_timestamp, callback){
            var self = this; 
            if(last_timestamp=='')
            	this.SearchMessageRequest=$.getJSON(self.client.api_root + '/search.json?type=messages&q=' + search_text, callback);
            else {
	       		var t=Math.round(Date.parse(last_timestamp) / 1000);
            	this.SearchMessageRequest=$.getJSON(self.client.api_root + '/search.json?type=messages&q=' + search_text +'&before='+t, callback);
            }            
        }
    };
    this.SearchNewMessage = {
        client:this,
        find:function(search_text, new_timestamp, callback){
            var self = this; 
            var t=Math.round(Date.parse(new_timestamp) / 1000);
            this.SearchNewMessageRequest=$.getJSON(self.client.api_root + '/search.json?type=messages&q=' + search_text +'&after='+t, callback);                        
        }
    };    
    $(document).ajaxError(function(event, request, settings) {
        if (request.status == 403) {
            showFailureMessage(jQuery.parseJSON(request.responseText).description);
        }
    });
    this.Utilities = {
        replaceURLWithHTMLLinks:function(text) {
            var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
            return text.replace(exp,"<a href='$1' onclick='event.stopPropagation();' target='_blank'>$1</a>");
        },
        timeToDescription:function(time) {
            if(time instanceof Date === false) {
                time = new Date(Date.parse(time));
            }
            var desc = "dunno";
            var now = new Date();
            var howLongAgo = Math.abs(now - time);
            var seconds = Math.round(howLongAgo/1000);
            var minutes = Math.round(seconds/60);
            var hours = Math.round(minutes/60);
            if(seconds === 0) {
                desc = "just now";
            }
            else if(minutes < 1) {
                //desc = seconds + "s";
                desc = seconds + " second" + (seconds !== 1?"s":"") + " ago";
            }
            else if(minutes < 60) {
                //desc = "about " + minutes + " minute" + (minutes !== 1?"s":"") + " ago";
                desc = minutes + "m";
            }
            else if(hours < 48) {
                //desc = "about " + hours + " hour"  + (hours !== 1?"s":"") + " ago";
                desc = hours + "h";
            }
            else {
                desc = time.getDate()  + " " + ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"][time.getMonth()];
            }
            return desc;
        }
    };

}
function showFailureMessage(text) {
    if($("#flash_alert").length < 1)
        $("body").append("<div id='flash_alert'>" + text + "</div>");
    else
        $("#flash_alert").html(text);

    $("#flash_alert").show('slow');

    setTimeout('$("#flash_alert").hide("slow")',5000);
}
