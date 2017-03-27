//地图操作对象
var FM = {
    width:300,
    height:600,
    level:'world',//默认显示世界地图
    currentLevel:'world',//当前操作的地图级别
    currentOperProvince:'',//当前操作的省的地图属性
    jSelectEle:null,//jvectormap当前选中的元素
    mapRegion:null,//svgmap省市对象
    jMap:null,//jvectormap世界地图对象
    jCNMap:null,//jvectormap中国地图对象
    lightIcon:1,//点亮足迹的图片编号
    locateBlinkFlag:1,//定位闪烁标识
    isLight:false,//是否点亮足迹
    isLightHistoryFootmark:false,//是否点亮历史足迹
    lightHistoryFootmarkTip:[],
    isLocate:false,//是否手机定位
    mapTransformPosition:[],//地图初始加载的位置
    lightedCountryCityMsg:[],//已点亮的国家或城市信息
    lightedCountryCity:'',
    selectRegionName:'',//当前点击的地图区域名称
    selectRegion:[],//当前点击的地图区域名称
    userHeadimg:'default.png',
    interval:0,//点亮足迹图片切换
    provinceContainer:[],//已加载的省地图数据
    historyFootmark:[],//已点亮的历史足迹
    currentCountryName:null,//手机定位当前所在的国家名称
    currentProvinceName:null,//手机定位当前所在的省名称
    currentCityName:null,//手机定位当前所在的市名称
    currentCityCode:null,//手机定位当前所在的市编码
    currentCountry:null,//手机定位当前所在的国家地图属性
    currentProvince:null,//手机定位当前所在的省地图属性
    currentCity:null,//手机定位当前所在的市地图属性
    init:function(){
        FM.width = $(window).width();
        FM.height = $(window).height()-50;
        $('#country_merc').width(FM.width).height(FM.height);
        $('#world_merc').width(FM.width).height(FM.height);
        $('#cn_merc').width(FM.width).height(FM.height);
        $('#province').width(FM.width).height(FM.height);
        if(isself == '1'){//当前用户操作
            $("#lightbutton").bind("click",FM.clickLightButton);   //点亮足迹事件
            $("#lighthistoryfootmark").bind("click",FM.lightHistoryFootmark); //点亮过往足迹事件

            //$('.tipMask').css('display','block');
            setTimeout(function(){
                FM.tipMask();
            },500);

        }

        $("#goback").bind("click",FM.goBack);
        $("#changeicon").bind("click",FM.changeMapByIcon);
        $(".tipMask").bind("click",function(){
            $('.tipMask').hide();
        });
        $("#backSpan").bind("click",FM.goBack);     //顶部返回按钮
        FM.changeMap();                             //加载地图
        FM.locateLightedHistoryFootmark();          //历史点亮的足迹在地图上渲染
    },
    //卡片提示
    tipMask:function (msg,status){
        var display = $(".tipMask").css('display');
        if(display == 'none'){
            if(msg){
                $(".tipMask").show();
                $("#tipText").text(msg);
                if(status){
                    $(".tipimg").css('display','block');
                    $(".tipimg_error").css('display','none');
                }else{
                    $(".tipimg").css('display','none');
                    $(".tipimg_error").css('display','block');
                }
            }
        }else{
            $(".tipMask").hide();
            $("#tipText").text('');
        }
    },
    //返回浮点数值
    returnFloat:function (value) {
        var value = Math.round(parseFloat(value) * 100) / 100;
        var xsd = value.toString().split(".");
        if (xsd.length == 1) {
            value = value.toString() + ".00";
            return value;
        }
        if (xsd.length > 1) {
            if (xsd[1].length < 2) {
                value = value.toString() + "0";
            }
            return value;
        }
    },
    //获取用户头像、昵称信息
    getUserInfo:function(){
        var aj = $.ajax({
            url:ctx+"/app/footmark/footmarkleef/getUserInfo.do",
            data:{
                userid : userid
            },
            type:'get',
            dataType:'json',
            success:function(result) {
                if(result.success){
                    pic_ctx = result.imgpathurl;
                    var headimgpath = result.headimgpath.replace('.','_thumb_200.');
                    userHeadImgPath = pic_ctx+headimgpath;
                    userNickname = result.nickname;
                }
            },
            error : function(data) {
            }
        });
    },
    //点亮过往足迹按钮触发
    lightHistoryFootmark:function(){
        if(!FM.isLightHistoryFootmark){
            FM.tipMask('正在点亮过往足迹......',true);
            setTimeout(function(){
                callHandlerLightHistoryFootmark();
            },100);
        }else{
            FM.tipMask('您已点亮了过往足迹啦！',false);
        }
    },

    //手机定位
    locate:function(country,province,city){
        if(!FM.isLocate && isself == '1'){//如果是自己的足迹
            FM.locateLightedHistoryFootmark(function(){
                var aj = $.ajax({
                    url:ctx+"/app/footmark/mapdict/getMapDict.do",
                    data:{
                        userid : userid,
                        country : country,
                        province : province,
                        city : city
                    },
                    type:'get',
                    dataType:'json',
                    success:function(result) {
                        if(result.success){
                            var length = result.data.length;
                            if(length > 0){
                                for(var i=0;i<length;i++){
                                    var dict = result.data[i];
                                    var dataCode = dict.dataCode;
                                    var dataName = dict.dataName;
                                    var level = dict.level;
                                    if(level == 1){
                                        FM.currentCountryName = dataName;
                                        FM.currentCountry  = dataCode;
                                    }else if(level == 2){
                                        FM.currentProvinceName = dataName;
                                        FM.currentProvince  = dataCode;
                                    }else if(level == 3){
                                        FM.currentCity  = dataCode;
                                        FM.currentCityName = dataName;
                                    }
                                }
                                if(FM.currentCountry != 'CN'){//如果不是在中国，只保存国家名称
                                    FM.currentProvince  = '';
                                    FM.currentCity  = '';
                                    FM.currentProvinceName = '';
                                    FM.currentCityName = '';
                                }
                                if(FM.currentProvince == 'aomen' || FM.currentProvince == 'taiwan' || FM.currentProvince == 'xianggang'
                                    || FM.currentProvince == 'beijing'|| FM.currentProvince == 'shanghai'|| FM.currentProvince == 'tianjin'|| FM.currentProvince == 'chongqing'){
                                    FM.currentCity = FM.currentProvince;
                                    FM.currentCityName = FM.currentProvinceName;
                                }
                                if(FM.currentCountry == 'CN' && (!FM.currentCity || FM.currentCity == '')){
                                    FM.tipMask();
                                    FM.tipMask('无法定位您当前所在的城市！',false);
                                    return;
                                }
                                FM.isLocate = true;
                                clearInterval(FM.interval);
                                setTimeout(function(){
                                    FM.tipMask();
                                },500);
                                FM.changeHistoryFootmarkMapColor();
                            }else{
                                FM.isLocate = false;
                                FM.tipMask();
                                FM.tipMask('定位失败!',false);
                            }
                        }else{
                            FM.isLocate = false;
                            FM.tipMask();
                            FM.tipMask('定位失败!',false);
                        }
                    },
                    error : function(data) {
                        FM.isLocate = false;
                        FM.tipMask();
                        FM.tipMask('定位失败!',false);
                    }
                });
            });
        }
    },

    //定位地图闪烁
    locateBlink:function(){
        if(FM.currentCountry == 'CN' && (!FM.currentCity || FM.currentCity == '')){
            return;
        }
        if(FM.isLight){
            clearInterval(FM.interval);
            return;
        }else{   //#F2CA46 灰色     #DBD9DA 黄色
            if(FM.locateBlinkFlag == 1){
                $("[data-code='"+FM.currentCountry+"']").attr('fill','#F2CA46');
                $("[data-code='"+FM.currentProvince+"']").attr('fill','#F2CA46');
                $("[data-code='"+FM.currentCity+"']").attr('fill','#F2CA46');
                FM.locateBlinkFlag = 2;
            }else{
                $("[data-code='"+FM.currentCountry+"']").attr('fill','#DBD9DA');
                $("[data-code='"+FM.currentProvince+"']").attr('fill','#DBD9DA');
                $("[data-code='"+FM.currentCity+"']").attr('fill','#DBD9DA');
                FM.locateBlinkFlag = 1;
            }
        }
    },

    //读取  过往已点亮的足迹
    locateLightedHistoryFootmark:function(callback){
        if(FM.historyFootmark.length == 0){
            var result = {"detail":"Message [成功=true, 消息=查询成功。, 原始消息=null]","source":"","data":[{"updatetime":"","userid":"","selectColumns":"","ranknum":0,"type":0,"orderCon":"","whereCon":"","city":"beijing","country":"CN","isDelete":0,"citycode":"","content":"","createtime":"2017-01-07 15:31:00","id":"","title":"","provincename":"北京市","page":null,"deviceType":0,"province":"beijing","countryname":"中国","cityname":"北京市"},{"updatetime":"","userid":"","selectColumns":"","ranknum":0,"type":0,"orderCon":"","whereCon":"","city":"c5303","country":"CN","isDelete":0,"citycode":"","content":"","createtime":"2016-08-29 16:11:17","id":"","title":"","provincename":"云南省","page":null,"deviceType":0,"province":"yunnan","countryname":"中国","cityname":"曲靖市"}],"code":"100","success":true,"msg":"查询成功。"};
            if(result.success){
                var length = result.data.length;
                if(length>0){
                    FM.historyFootmark = result.data;
                    FM.changeHistoryFootmarkMapColor();
                }
            }
            if(typeof callback === 'function'){
                callback();
            }
        }else{
            if(typeof callback === 'function'){
                callback();
            }
        }
    },
    //改变地图颜色
    changeHistoryFootmarkMapColor:function(){
        var length = FM.historyFootmark.length;
        var isLight = false;
        if(length > 0){
            for(var i=0;i<length;i++){
                var footmark =  FM.historyFootmark[i];
                var country = footmark.country;
                var province = footmark.province;
                var city = footmark.city;
                $("[data-code='"+country+"']").attr('fill','#F2CA46');
                $("[data-code='"+province+"']").attr('fill','#F2CA46');
                $("[data-code='"+city+"']").attr('fill','#F2CA46');
                if(footmark.countryname == FM.currentCountryName && ((FM.currentCityName == footmark.cityname || FM.currentProvinceName == footmark.cityname) ||
                    (footmark.cityname == '' && footmark.provincename == ''))){
                    isLight = true;
                }
            }
        }
        if(FM.currentLevel != 'country' && FM.currentLevel != 'specialarea' && !isLight){
            clearInterval(FM.interval);
            FM.interval = setInterval("FM.locateBlink()",500);
        }
    },

    //点亮手机相册的历史足迹  处理  (读手机相册  点亮历史足迹——步骤1)
    lightHistoryFootmarkFromPhoto:function(countryName,provinceName,cityName){
        var length = FM.historyFootmark.length;  //历史点亮的足迹
        var isContain = false;
        if((!cityName || cityName =='') && provinceName){
            cityName = provinceName;
        }

        //判断在字典表中是否存在 该地址
        var aj = $.ajax({
            url:ctx+"/app/footmark/mapdict/getMapDict.do",
            data:{
                country : countryName,
                province : provinceName,
                city : cityName
            },
            type:'get',
            dataType:'json',
            success:function(result) {
                if(result.success){
                    var length = result.data.length;
                    if(length > 0){
                        var dictFull = {countryname:countryName,provincename:provinceName,cityname:cityName};
                        for(var i=0;i<length;i++){
                            var dict = result.data[i];
                            var dataCode = dict.dataCode;
                            var dataName = dict.dataName;
                            var level = dict.level;
                            if(level == 1){
                                dictFull.countryname = dataName;
                                dictFull.country  = dataCode;
                            }else if(level == 2){
                                dictFull.provincename = dataName;
                                dictFull.province  = dataCode;
                            }else if(level == 3){
                                dictFull.cityname = dataName;
                                dictFull.city  = dataCode;
                            }
                        }
                        if(!dictFull.country){//如果国家为空
                            FM.tipMask();
                            FM.tipMask('未知的地区：'+countryName+provinceName+cityName+'!国家在字典中不存在。',false);
                            return;
                        }
                        if(dictFull.country != 'CN'){//不是中国的，只保存国家名称
                            dictFull.province='';
                            dictFull.provincename='';
                            dictFull.city='';
                            dictFull.cityname='';
                        }

                        //对特殊地区处理
                        //alert("dictFull.province="+dictFull.province);
                        if(dictFull.province == 'aomen' || dictFull.province == 'taiwan' || dictFull.province == 'xianggang'
                            || dictFull.province == 'beijing'|| dictFull.province == 'shanghai'|| dictFull.province == 'tianjin'|| dictFull.province == 'chongqing'){
                            dictFull.city = dictFull.province;
                            dictFull.cityname = dictFull.provincename;
                        }
                        if(dictFull.country == 'CN' && (!dictFull.city || dictFull.city == '')){
                            FM.tipMask();
                            FM.tipMask('未知的地区：'+countryName+provinceName+cityName+'!',false);
                            return;
                        }

                        //判断该地区是否点亮过
                        length = FM.historyFootmark.length;
                        if(length>0){
                            for(var i=0;i<length;i++){
                                var obj = FM.historyFootmark[i];
                                var country = obj.country;
                                if(country == 'CN'){   //中国
                                    if((obj.countryname==dictFull.countryname && obj.provincename==dictFull.provincename) && (obj.cityname==dictFull.cityname || obj.cityname == dictFull.provincename)){
                                        isContain = true;    //点亮过
                                        break;
                                    }
                                }else{  //外国
                                    if(obj.countryname == dictFull.countryname){
                                        isContain = true;
                                        break;
                                    }
                                }
                            }
                        }

                        if(!isContain){ //未点亮过，保存
                            FM.changeHistoryFootmarkMapColor();
                            FM.savePhotoFootmark(dictFull);   //读手机相册  点亮历史足迹——步骤2
                        }else{
                            var country_city = "";
                            if(dictFull.cityname){
                                country_city = dictFull.cityname;
                            }else if(dictFull.countryname){
                                country_city = dictFull.countryname;
                            }
                            //FM.tipMask();
                            //FM.tipMask('您已经点亮过'+country_city+'了!无需重复点亮。',false);
                        }
                    }
                }
            },
            error : function(data) {
            }
        });
    },

    //保存过往足迹 保存处理     (读手机相册  点亮历史足迹——步骤2  保存数据处理)
    savePhotoFootmark:function(obj){
        var aj = $.ajax({
            url:ctx+"/app/footmark/footmark/saveFootmark.do",
            data:{
                userid : userid,
                country : obj.country,
                province : obj.province,
                city : obj.city,
                countryname : obj.countryname,
                provincename : obj.provincename,
                cityname : obj.cityname,
                citycode : '',
                type:'photo',
                deviceType : deviceType
            },
            type:'post',
            dataType:'json',
            success:function(result) {
                var country_city = "";
                if(obj.cityname){
                    country_city = obj.cityname;
                }else if(obj.countryname){
                    country_city = obj.countryname;
                }
                if(result.success){
                    if(result.code == '100'){
                        //var notify = result.msg.replace(/\|/g,"");
                        //notificationLightHistoryFootmark('已为您点亮'+country_city+'!');
                        FM.tipMask();
                        FM.tipMask('已为您点亮'+country_city+'!',true);
                        FM.historyFootmark.push(obj);
                    }else{
                        //notificationLightHistoryFootmark('您已经点亮'+country_city+'啦!');

                        // 不提示算了
                        //FM.tipMask();
                        //FM.tipMask('您已经点亮过'+country_city+'了!无需重复点亮。',false);
                        //$(".tipMask").hide();
                    }
                    FM.isLightHistoryFootmark = true;
                    if(obj.countryname == FM.currentCountryName && ((FM.currentCityName == obj.cityname || FM.currentProvinceName == obj.cityname) ||
                        (obj.cityname == '' && obj.porvincename == ''))){
                        FM.isLight = true;
                    }
                }else{
                    FM.tipMask();
                    FM.tipMask(country_city+'点亮失败啦!',false);
                }
            },
            error : function(data) {
                FM.tipMask();
                FM.tipMask(country_city+'点亮失败啦!',false);
            }
        });
    },

    //保存足迹(手动点亮 足迹)
    saveFootMark:function(param){
        // 创建地点，则可以补点亮足迹
        if(param != 'undefined' && param != null){  //改变当前地点为选择的地点
            FM.currentCountry = param.country;
            FM.currentProvince = param.province;
            FM.currentCity = param.city;
            FM.currentCountryName = param.countryName;
            FM.currentProvinceName =  param.provinceName;
            FM.currentCityName = param.cityName;
        }

        if(!FM.isLight){
            var aj = $.ajax({
                url: ctx+"/app/footmark/footmark/saveFootmark.do",
                data: {
                    userid : userid,
                    country : FM.currentCountry,
                    province : FM.currentProvince,
                    city : FM.currentCity,
                    countryname : FM.currentCountryName,
                    provincename : FM.currentProvinceName,
                    cityname : FM.currentCityName,
                    citycode : '',
                    deviceType : deviceType
                },
                type:'post',
                dataType:'json',
                success:function(result) {
                    debugger;
                    if(result.success){
                        var country_city = "";
                        if(FM.level == 'country'){
                            country_city = FM.currentCountryName;
                        }else if(FM.level == 'city'){
                            country_city = FM.currentCityName;
                        }
                        if(result.code == '102'){//已点亮过
                            var length = FM.lightedCountryCityMsg.length;
                            if(length>0){
                                for(var i = 0;i<length;i++){
                                    var msg = FM.lightedCountryCityMsg[i];
                                    var msgs = msg.split(':');
                                    if(msgs[0] == country_city){
                                        result.msg = msgs[1];
                                    }
                                }
                            }
                        }else{
                            FM.historyFootmark.push({
                                country : FM.currentCountry,
                                province : FM.currentProvince,
                                city : FM.currentCity,
                                countryname : FM.currentCountryName,
                                provincename : FM.currentProvinceName,
                                cityname : FM.currentCityName,
                                citycode : ''
                            });
                            FM.lightedCountryCityMsg.push(country_city+':'+result.msg);
                        }
//			    		var notify = result.msg.replace(/\|/g,"");
                        var msg = result.msg.split('|');//倾世等一人|2016年|1月16日|点亮|中国大理白族自治州|。已经有|1|个人在大理白族自治州留下足迹
                        var nickname = msg[0]?msg[0]:'';
                        var year = msg[1]?msg[1]:'';
                        var daymouth = msg[2]?msg[2]:'';
                        var content = msg[3]?msg[3]:'';
                        var location = msg[4]?msg[4]:'';
                        var content1 = msg[5]?msg[5]:'';
                        var ranknum = msg[6]?msg[6]:'';
                        var content2 = msg[7]?msg[7]:'';
                        $('#shareCardText').html(
                            '<div class="card_title">'
                            + nickname
                            + '</div><div><span class="card_content">'
                            + year+daymouth+content
                            + '</span><span class="card_location">'
                            + location
                            + '</span><br/><span class="card_content">'
                            + content1
                            + '</span><span class="card_location">'
                            + ranknum
                            + '</span><span class="card_content">'
                            + content2
                            + '</span></div>');
                        FM.lightedCountryCity = country_city;
                        clearInterval(FM.interval);
                        $('#lightbutton').attr('src',ctx+'/pages/footmark/resource/common/images/lighting_2.png?v=1.0.0');
                        $(FM.jSelectEle).attr('fill','#F2CA46');
                        FM.isLight = true;
                        $("#shareCardDiv").css('display','block');

                        //$("#tipText").text('成功点亮'+country_city+'!');
                        //FM.tipMask();


                        //点亮成功 之后,加载mapbox展示
                        //按照点亮的城市展示   V3.x 版本展示 POI 地址内容
                        POIFM.footmark.push({    //当前点亮的足迹
                            city : FM.currentCityName,
                            date : year+daymouth
                        });

                        POIFM.currentCountryName = FM.currentCountryName;
                        POIFM.currentCityName = FM.currentCityName;
                        POIFM.loadData();

                        //notificationLightHistoryFootmark('成功点亮'+country_city+'!');
                    }else{
                        FM.tipMask();
                        FM.tipMask(result.msg,false);
                        //notificationLightHistoryFootmark(result.msg);
                    }
                },
                error : function(result) {
                    FM.tipMask();
                    FM.tipMask('点亮失败',false);
                    //notificationLightHistoryFootmark('点亮失败');
                }
            });
        }else{
            FM.tipMask();
            FM.tipMask('您已成功点亮'+FM.lightedCountryCity+'哦!',false);
            //notificationLightHistoryFootmark('您已成功点亮'+FM.lightedCountryCity+'哦!');
        }
    },

    //返回
    goBack:function(){
        FM.isLight = false;
        var country = FM.selectRegion['country'];
        var province = FM.selectRegion['province'];
        var city = FM.selectRegion['city'];

        if(FM.currentLevel == 'footmarkleeflist'){//足迹列表页面
            $('#footmarkleeflists').css('display','none');
            $('#footmarkleeflists_background').css('display','none');
            $('#myleef').css('display','block');
            $('#shareMapPageDiv').css('display','block');
            FM.currentLevel = 'messagetree';
            LFM.isLeefList = false;
        }else if(FM.currentLevel == 'messagetree'){//留言树页面
            $('.messageCard').css('display','none');
            $('.messagetree_div').css('display','none');

            $('#shareMapPageDiv').css('display','block');  //分享按钮
            //返回是mapbox这一层的话，分享按钮隐藏、风筝按钮显示
            if(POIFM.map){
                $("#poiSummaryNumDiv").css('display','block');
                $("#createPoiAddressDiv").css('display','block');  //创建poi 地点
                $('#shareMapPageDiv').css('display','none');
            }

            if(FM.level == 'china' && (province == 'aomen' || province == 'taiwan' || province == 'xianggang'
                || province == 'beijing'|| province == 'shanghai'|| province == 'tianjin'|| province == 'chongqing')){
                FM.currentLevel = 'specialarea';//在港澳台或四个直辖市级别操作的
            }else if(!country){
                FM.currentLevel = 'world';//在首页操作的
            }else if(FM.level == 'country' && (!province || province == '') && (!city || city == '')){
                FM.currentLevel = 'country';//在除中国外的其他国家级别操作的
            }else if(FM.level == 'world' && country == 'CN' && (!province || province == '') && (!city || city == '')){
                FM.currentLevel = 'china';//在中国
            }else if(FM.level == 'china' && country == 'CN' && province && (!city || city == '')){
                FM.currentLevel = 'province';//在省级操作
            }else if(FM.level == 'city' && country == 'CN' && province && city){
                FM.currentLevel = 'city';//在市级操作
            }
            LFM.removeShakeEvent();
            $('.openmessagetree').css('display','block');
            clearInterval(LFM.interval);
        }else if(FM.currentLevel == 'world'){//首页
            goBackToHomePage();
        }else{
            $('.divbutton').css('display','none');
            $('#shareMapPageDiv').css('display','block');
            if(FM.level == 'city'){//市级页面
                $("#footmarktimeline").css('display','none');
                $('#province').css('display','block');
                $('#changeicon').css('display','block');

                //mapbox 图层处理（返回时，移除图层）
                if(POIFM.map){
                    POIFM.map.remove();
                    POIFM.map = null;
                    POIFM.map_popup = null;
                }
                $("#poiMapBox").css('display','none');  //隐藏掉mapbox
                $("#poiSummaryNumDiv").css('display','none');
                $("#createPoiAddressDiv").css('display','none');  //创建poi 地点
                $("#poiMapBox").html('');

                //重置省级地图位置
                //$('#province').css('visibility','hidden');
                FM.mapRegion.options.stateShowAll = true;
                FM.mapRegion.options.stateShowList=[];
                FM.mapRegion.render();
                FM.currentLevel = 'province';
                FM.level = 'china';
                $('.lightdiv').css('display','none');
                if(isself=='1'){
                    $('.operatordiv_3').css('display','block');
                }
//	           	$('.messagetree').css('display','none');
                $("#shareCardDiv").css('display','none');
                $(FM.jSelectEle).attr('fill','#DBD9DA');
                FM.changeHistoryFootmarkMapColor();
                $('#headtitle').text(FM.selectRegionName);
                /*setTimeout(function(){
                 var svg = $('#province > .svggroup > svg');
                 var viewbox = FM.mapTransformPosition['province_'+FM.currentOperProvince];
                 svg[0].attributes['viewBox'].value = viewbox;
                 $('#province').css('visibility','visible');
                 },100);*/
                FM.selectRegion['city'] = null;
            }else{
                FM.changeMap();
            }
        }
    },

    //点击切换图片小图标时执行地图切换
    changeMap:function(){
        $('#province').css('display','none');
        $('#cn_merc').css('display','none');
        $('#world_merc').css('display','none');
        $('#city').css('display','none');
        $('.lightdiv').css('display','none');
        $('.divbutton').css('display','none');
        $('#changeicon').css('display','block');
        $(FM.jSelectEle).attr('fill','#DBD9DA');
        FM.isLight = false;
        clearInterval(FM.interval);

        /*debugger;*/
        if(FM.level == 'world'){
            if(isself=='1'){
                $('.operatordiv_1').css('display','block');
            }

            $('#world_merc').css('display','block');
            $('#changeicon').attr('src',ctx+'/pages/footmark/resource/common/images/china.png');
            var eleLen = $("div#world_merc > .jvectormap-container").length;
            if(eleLen == 0){
                FM.jMap = $('#world_merc').vectorMap({//加载世界地图
                    map: 'world_merc',
                    backgroundColor: 'transparent',
                    regionsSelectable:true,
                    regionStyle: {
                        initial: {
                            fill: '#DBD9DA'
                        }
                    }/*,
                     onRegionSelected:function(e, code, isSelected, selectedRegions){
                     if(FM.isLight && FM.level == 'country'){//当点亮地图时，再点击会变回初始颜色
                     FM.isLight = false;
                     }
                     }*/
                });
                /*var position = $('#world_merc > .jvectormap-container > svg > g')[0];
                 position = $(position).attr('transform');
                 FM.mapTransformPosition['world'] = position;*/
                var container = $('#world_merc > .jvectormap-container')[0];
                $(container).height(FM.height);
                $(container).width(FM.width);
            }
            FM.level = 'china';
            FM.currentLevel = 'world';
            $('#footmarkListShowDiv').css('display','block');
        }else if(FM.level == 'china' || FM.level == 'city'){
            if(FM.level == 'city'){
                //重置省级地图
                FM.mapRegion.options.stateShowAll = true;
                FM.mapRegion.options.stateShowList=[];
                FM.mapRegion.render();
            }
            FM.level = 'world';
            $('#cn_merc').css('display','block');
            if(isself=='1'){
                $('.operatordiv_3').css('display','block');
            }
            $('#changeicon').attr('src',ctx+'/pages/footmark/resource/common/images/world.png');
            var eleLen = $("div#cn_merc > .jvectormap-container").length;
            //FM.interval = setInterval("FM.locateBlink()",500);
            if(eleLen == 0){
                FM.jCNMap = $('#cn_merc').vectorMap({//加载中国地图
                    map: 'cn_merc',
                    backgroundColor: 'transparent',
                    regionStyle: {
                        initial: {
                            fill: '#DBD9DA'
                        }
                    }
                });
                var container = $('#cn_merc > .jvectormap-container')[0];
                $(container).height(FM.height);
                $(container).width(FM.width);
            }
            if(FM.currentLevel == 'specialarea'){
                var preEle = $(FM.jSelectEle).prevAll();
                var nextEle = $(FM.jSelectEle).nextAll();
                $(preEle).show();
                $(nextEle).show();
            }
            FM.currentLevel = 'china';
            $('#footmarkListShowDiv').css('display','none');
        }else if(FM.level == 'country'){
            if(isself=='1'){
                $('.operatordiv_1').css('display','block');
            }
            if(isShare == 1){  //分享H5页面，点亮过往按钮显示
                $('#lighthistoryfootmark').css('display','block');
            }

            $('#world_merc').css('display','block');
            FM.level = 'china';
            var preEle = $(FM.jSelectEle).prevAll();
            var nextEle = $(FM.jSelectEle).nextAll();
            $(preEle).show();
            $(nextEle).show();
            $('#changeicon').attr('src',ctx+'/pages/footmark/resource/common/images/china.png');
            FM.currentLevel = 'world';
            $('#footmarkListShowDiv').css('display','none');
        }
        FM.changeHistoryFootmarkMapColor();
        if(FM.currentLevel == 'world' && FM.jMap){
            FM.jMap.reset();//重置地图
            $('.map-middle').text('世界');
            FM.selectRegion['country'] = null;
        }else if(FM.currentLevel == 'china' && FM.jCNMap){
            FM.jCNMap.reset();
            $('.map-middle').text('中国');
        }
        FM.selectRegion['city'] = null;
        FM.selectRegion['province'] = null;
    },

    //点亮足迹按钮闪烁
    changeLightButton:function(){
        if(FM.lightIcon==1){
            FM.lightIcon = 2;
        }else{
            FM.lightIcon = 1;
        }
        $('#lightbutton').attr('src',ctx+'/pages/footmark/resource/common/images/lighting_'+FM.lightIcon+'.png?v=1.0.0');
    },


    //点击市级别的地图
    cityClickCallback:function(obj){
        FM.jSelectEle = $(obj[0]);
        FM.forwardToHistoryFootmark(obj.id,function(){
            $('.map-middle').text(obj.name);
            //只显示某个市的地图
            FM.mapRegion.options.stateShowAll = false;
            FM.mapRegion.options.stateShowList.push(obj.id);
            FM.mapRegion.render();
            FM.level = 'city';
            FM.currentLevel = FM.level;
            clearInterval(FM.interval);
            $(FM.jSelectEle).attr('fill','#DBD9DA');
            $('.divbutton').css('display','none');
            if(isself=='1'){
                // alert("cityClickCallback");
                $('.operatordiv_2').css('display','block');
                $('.messagetree').css('display','block');
                FM.interval = setInterval("FM.changeLightButton()",500);
                $('.lightdiv').css('display','block');
            }
            FM.mapRegion.panZoom.zoomIn(3);//地图放大三倍
        });

        $("#poiSummaryNumDiv").css({'display':'none'});   //mapbox中pop 弹窗
        $("#createPoiAddressDiv").css('display','none');  //创建poi 地点
        $("#shareMapPageDiv").css({'display':'block'});   //分享页面按钮
    },

    //创建省级地图
    createSVGMap:function(datacode){
        $('#province').css({display:'block'});
        if(FM.currentOperProvince != datacode){
            FM.currentOperProvince = datacode;
            var mapRegion = $('#province').SVGMap({
                mapName: datacode,
                mapWidth: FM.width,
                mapHeight: FM.height,
                stateInitColor: '#DBD9DA',
                stateHoverColor:'#DBD9DA',
                stateSelectedColor:'#DBD9DA',
                showTip: false,
                showTipInit: false,
                showName: true,
                showCapital: true,
                stateShowAll:true,
                stateShowList:[],
                clickColorChange: true,
                /*hoverCallback: function (stateData, obj) {
                 FM.forwardToHistoryFootmark(obj);
                 },*/
                unClickCallback: function(stateData, obj){//取消事件
                    FM.cityClickCallback(obj);
                },
                clickCallback: function(stateData, obj){//点击事件
                    FM.cityClickCallback(obj);
                }
            });
            FM.mapRegion = mapRegion;
            /*$("div#province").panzoom({
             minScale: 1,
             maxScale: 5
             });*/
        }
        FM.currentLevel = 'province';
        $('.jvectormap').css('display','none');
        $('#cn_merc').css('display','none');
        $('#world_merc').css('display','none');
        $('.lightdiv').css('display','none');
        $('#changeicon').attr('src',ctx+'/pages/footmark/resource/common/images/china.png');
        FM.changeHistoryFootmarkMapColor();

    },

    forwardToHistoryFootmark:function(datacode,callback){
        //当前点击地图的国家、省份、市区属性信息集合
        if(FM.currentLevel == 'world'){
            FM.selectRegion['country'] = datacode;
            FM.selectRegion['province'] = '';
            FM.selectRegion['city'] = '';
        }else if(FM.currentLevel == 'china'){
            FM.selectRegion['province'] = datacode;
        }else if(FM.currentLevel == 'province'){
            FM.selectRegion['city'] = datacode;
        }
        //如果点击是除中国以外的国家或中国的某个市
        if((FM.currentLevel == 'world' || FM.currentLevel == 'china' || FM.currentLevel == 'province') && datacode!='CN' ){
            if(FM.currentLevel == 'world'){
                FM.level = 'country';
                FM.currentLevel = 'country';
            }
            var length = FM.historyFootmark.length;
            if(length > 0){//判断当前所点击的地图是否是历史足迹已点亮的
                //debugger;
                for(var i=0;i<length;i++){
                    var footmark = FM.historyFootmark[i];
                    if(datacode == footmark.country || datacode == footmark.city  ){  //点亮足迹与当前城市有匹配的
                        HFM.currentCountryName = footmark.countryname;
                        HFM.currentCityName = footmark.cityname;

                        //HFM.loadData();   //V2.x 版本展示 足迹+游记列表内容

                        //alert("加载POI数据");
                        //按照点亮的城市展示   V3.x 版本展示 POI 地址内容
                        //POIFM.footmark = footmark;      //当前点亮的足迹
                        POIFM.footmark.push({
                            city : footmark.cityname,
                            date : footmark.createtime
                        });
                        POIFM.currentCountryName = footmark.countryname;
                        POIFM.currentCityName = footmark.cityname;
                        POIFM.loadData();

                        $("#poiSummaryNumDiv").css({'display':'block'}); //mapbox中pop 弹窗
                        $("#createPoiAddressDiv").css('display','block');  //创建poi 地点
                        $("#shareMapPageDiv").css({'display':'none'});   //分享页面按钮隐藏

                        return;
                    }
                }
            }
        }
        if(typeof callback === 'function'){
            callback();
        }
    },
    //当点击jvectormap地图回调方法
    clickCallback:function(event){
        var eleObj = $(event.target);
        var datacode = $(eleObj).attr('data-code');
        FM.jSelectEle = eleObj;
        var areaname = event.target.areaname;
        FM.selectRegionName = areaname;
        $('.map-middle').text(FM.selectRegionName?FM.selectRegionName:'');
        FM.forwardToHistoryFootmark(datacode,function(){
            if(FM.level == 'world'){
                FM.level = 'china';
                if(datacode == 'aomen' || datacode == 'taiwan' || datacode == 'xianggang'
                    || datacode == 'beijing'|| datacode == 'shanghai'|| datacode == 'tianjin'|| datacode == 'chongqing'){
                    var preEle = $(FM.jSelectEle).prevAll();
                    var nextEle = $(FM.jSelectEle).nextAll();
                    $(preEle).hide();
                    $(nextEle).hide();
                    $(FM.jSelectEle).attr('fill','#DBD9DA');
                    $('#cn_merc').vectorMap('set', 'focus', datacode);//重新渲染居中
                    FM.currentLevel = 'specialarea';
                    $('.divbutton').css('display','none');
                    if(isself=='1'){
                        //alert("clickCallback1");
                        $('.lightdiv').css('display','block');
                        $('.operatordiv_2').css('display','block');
                        $('.messagetree').css('display','block');
                        clearInterval(FM.interval);
                        FM.interval = setInterval("FM.changeLightButton()",500);
                    }
                }else{
                    var version = '';
                    if(datacode=='hubei'){//湖北地图文件襄樊市改为襄阳市
                        version = '?v=1.0.0';
                    }
                    FM.loadJS('../../../../gapday/resource/svgmap/data/china/' + datacode + '.js'+version, function(){
                        FM.createSVGMap(datacode);
                    });
                }
            }else if(datacode == 'CN'){
                FM.level = 'china';
                FM.changeMap();
            }else if(FM.currentLevel == 'world' || FM.currentLevel == 'country'){
                var preEle = $(eleObj).prevAll();
                var nextEle = $(eleObj).nextAll();
                $(preEle).hide();
                $(nextEle).hide();
                $(FM.jSelectEle).attr('fill','#DBD9DA');
                $('#world_merc').vectorMap('set', 'focus', datacode);//重新渲染居中
                FM.level = 'country';
                FM.currentLevel = FM.level;
                $('#changeicon').attr('src',ctx+'/pages/footmark/resource/common/images/world.png');
                $('.divbutton').css('display','none');
                if(isself=='1'){
                    //alert("clickCallback2");
                    $('.operatordiv_2').css('display','block');
                    $('.messagetree').css('display','block');
                    $('.lightdiv').css('display','block');
                    clearInterval(FM.interval);
                    FM.interval = setInterval("FM.changeLightButton()",500);
                }

                $("#poiSummaryNumDiv").css({'display':'none'}); //mapbox中pop 弹窗 隐藏
                $("#createPoiAddressDiv").css('display','none');  //创建poi 地点

                $('#footmarkListShowDiv').css('display','none');   //足迹列表 按钮
            }
        });
    },

    //区域切换"切换地图"
    changeMapByIcon:function(){
        FM.changeMap();
    },

    // 显示省份数据
    loadJS:function(fileName, callMyFun){
        FM.tipMask('正在加载地图数据......',true);
        if(FM.provinceContainer.indexOf(fileName) < 0){//如果已经加载过，就不用再加载
            FM.provinceContainer.push(fileName);
            var otherJScipt = document.createElement("script");
            otherJScipt.setAttribute("type", "text/javascript");
            otherJScipt.setAttribute("src", fileName);
            document.getElementsByTagName("head")[0].appendChild(otherJScipt);//追加到head标签内
            otherJScipt.onload = function () {
                otherJScipt.onload = null;
                callMyFun();
                FM.tipMask();
            };
        }else{
            callMyFun();
            FM.tipMask();
        }
    }
};