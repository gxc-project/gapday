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
        FM.height = $(window).height() - 44;
        $('#country_merc').width(FM.width).height(FM.height);
        $('#world_merc').width(FM.width).height(FM.height);
        $('#cn_merc').width(FM.width).height(FM.height);
        $('#province').width(FM.width).height(FM.height);
        if(isself == '1'){//当前用户操作
            $("#lightbutton").bind("click",FM.clickLightButton);   //点亮足迹事件
            $("#lighthistoryfootmark").bind("click",FM.lightHistoryFootmark); //点亮过往足迹事件
        }

        $("#goback").bind("click",FM.goBack);
        $("#changeicon").bind("click",FM.changeMapByIcon);
        $("#backSpan").bind("click",FM.goBack);     //顶部返回按钮
        FM.changeMap();                             //加载地图
        FM.locateLightedHistoryFootmark();          //历史点亮的足迹在地图上渲染
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

    //点亮过往足迹按钮触发
    lightHistoryFootmark:function(){
        if(!FM.isLightHistoryFootmark){
            setTimeout(function(){
                callHandlerLightHistoryFootmark();
            },100);
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
                                FM.isLocate = true;
                                clearInterval(FM.interval);
                                FM.changeHistoryFootmarkMapColor();
                            }else{
                                FM.isLocate = false;
                            }
                        }else{
                            FM.isLocate = false;
                        }
                    },
                    error : function(data) {
                        FM.isLocate = false;
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
            return false;
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

    //返回
    goBack:function(){
        FM.isLight = false;
        var country = FM.selectRegion['country'];
        var province = FM.selectRegion['province'];
        var city = FM.selectRegion['city'];

        if(FM.currentLevel == 'world'){//首页
            goBackToHomePage();
        }else{
            $('.divbutton').css('display','none');
            $('#shareMapPageDiv').css('display','block');
            if(FM.level == 'city'){//市级页面
                $("#footmarktimeline").css('display','none');
                $('#province').css('display','block');
                $('#changeicon').css('display','block');
                FM.mapRegion.options.stateShowAll = true;
                FM.mapRegion.options.stateShowList=[];
                FM.mapRegion.render();
                FM.currentLevel = 'province';
                FM.level = 'china';
                $(FM.jSelectEle).attr('fill','#DBD9DA');
                FM.changeHistoryFootmarkMapColor();
                $('.map-middle').text(FM.selectRegionName);

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
                    }
                });
                var container = $('#world_merc > .jvectormap-container')[0];
                $(container).height(FM.height);
                $(container).width(FM.width);
            }
            FM.level = 'china';
            FM.currentLevel = 'world';
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
        if(FM.provinceContainer.indexOf(fileName) < 0){
            FM.provinceContainer.push(fileName);
            var otherJScipt = document.createElement("script");
            otherJScipt.setAttribute("type", "text/javascript");
            otherJScipt.setAttribute("src", fileName);
            document.getElementsByTagName("head")[0].appendChild(otherJScipt);//追加到head标签内
            otherJScipt.onload = function () {
                otherJScipt.onload = null;
                callMyFun();
            };
        }else{
            callMyFun();
        }
    }
};