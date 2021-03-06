var bridgeG,ctx = 'http://www.qingnianlvxing.com:80/lkapp';
function clickCallback(event) {
    if (event.type == 'mouseover') {  //点击地图区域进入下一级回调处理
        var areaname = event.target.areaname;
        $('.map-middle').text(areaname);
        FM.changeHistoryFootmarkMapColor();   //add by liujl 2016-3-11   解决部分手机点击地图后变灰不能进去下级地图bug
    } else if (event.type == 'mouseout') {
        if (FM.currentLevel == 'world') {
            $('.map-middle').text('世界');
        } else if (FM.currentLevel == 'china') {
            $('.map-middle').text('中国');
        }
        //改变地图颜色
        FM.changeHistoryFootmarkMapColor();
    } else {
        FM.clickCallback(event);
    }
}
$(function () {
    FM.init();    //足迹地图初始化
    $('.map-all').height($(window).height() - 44);
});


//地图操作对象   控制地图变化的总体对象
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
    lightHistoryFootmarkTip:[],
    selectRegionName:'',//当前点击的地图区域名称
    selectRegion:[],//当前点击的地图区域名称
    interval:0,//点亮足迹图片切换
    provinceContainer:[],//已加载的省地图数据
    historyFootmark:[],//已点亮的历史足迹
    plants:[
        {latLng:[39,116]}, {latLng:[41,110]},{latLng:[43.7,87.8]},{latLng:[45.7,126.8]}, {latLng:[41.7,123.5]}, {latLng:[29.7,91.3]},{latLng:[30.2,120]},
        {latLng:[29,106]},{latLng:[34.5,109.1]}, {latLng:[20,110]}, {latLng:[25,102]}, {latLng:[38,-77]}
    ],
    init:function(){
        FM.width = $(window).width();
        FM.height = $(window).height() - 44;
        $('#country_merc').width(FM.width).height(FM.height);
        $('#world_merc').width(FM.width).height(FM.height);
        $('#cn_merc').width(FM.width).height(FM.height);
        $('#province').width(FM.width).height(FM.height);

        $("#goback").bind("click",FM.goBack);
        $("#changeicon").bind("click",FM.changeMapByIcon);
        $("#backSpan").bind("click",FM.goBack);   //顶部返回按钮
        FM.changeMap();                              //加载地图
        FM.locateLightedHistoryFootmark();           //历史点亮的足迹在地图上渲染
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
        if(length > 0){
            for(var i=0;i<length;i++){
                var footmark =  FM.historyFootmark[i];
                var country = footmark.country;
                var province = footmark.province;
                var city = footmark.city;
                $("[data-code='"+country+"']").attr('fill','#F2CA46');
                $("[data-code='"+province+"']").attr('fill','#F2CA46');
                $("[data-code='"+city+"']").attr('fill','#F2CA46');
            }
        }
    },

    //返回
    goBack:function(){
        var country = FM.selectRegion['country'];
        var province = FM.selectRegion['province'];
        var city = FM.selectRegion['city'];

        if(FM.currentLevel == 'world'){//首页
            return false;
        }else{
            $('#shareMapPageDiv').css('display','block');
            if(FM.level == 'city'){//市级页面
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
        $('#changeicon').css('display','block');
        $(FM.jSelectEle).attr('fill','#DBD9DA');
        clearInterval(FM.interval);

        /*debugger;*/
        if(FM.level == 'world'){
            $('#world_merc').css('display','block');
            $('#changeicon').attr('src',ctx + '/pages/footmark/resource/common/images/china.png');
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
            $('#changeicon').attr('src',ctx + '/pages/footmark/resource/common/images/world.png');
            var eleLen = $("div#cn_merc > .jvectormap-container").length;
            if(eleLen == 0){
                FM.jCNMap = $('#cn_merc').vectorMap({//加载中国地图
                    map: 'cn_merc',
                    backgroundColor: 'transparent',
                    regionStyle: {
                        initial: {
                            fill: '#DBD9DA'
                        }
                    },
                    markers: FM.plants,
                    labels:{
                        offsets: function (index) {
                            return [0, 8];
                        }
                    },
                    series: {
                        markers: [{
                             attribute: 'image',
                             scale: {
                                'bank': 'images/icon.png'
                             },
                             values:FM.plants.reduce(function(p, c, i){ p[i] = 'bank'; return p }, {})
                        }]
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
        }else if(FM.level == 'country'){
            $('#world_merc').css('display','block');
            FM.level = 'china';
            var preEle = $(FM.jSelectEle).prevAll();
            var nextEle = $(FM.jSelectEle).nextAll();
            $(preEle).show();
            $(nextEle).show();
            $('#changeicon').attr('src',ctx + '/pages/footmark/resource/common/images/china.png');
            FM.currentLevel = 'world';
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
            FM.mapRegion.panZoom.zoomIn(3);//地图放大三倍
        });
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

        }
        FM.currentLevel = 'province';
        $('.jvectormap').css('display','none');
        $('#cn_merc').css('display','none');
        $('#world_merc').css('display','none');
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
        }
        if(typeof callback === 'function'){
            callback();
        }
    },
    //当点击jvectormap地图回调方法
    clickCallback:function(event){
        var eleObj = $(event.target);
        if($(eleObj).attr('class') == 'jvectormap-marker jvectormap-element'){
            $('.map-middle').text((FM.selectRegion.country == 'CN'?'中国':'世界') || FM.selectRegion.province);
            return false;
        }
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
                }else{
                    var version = '';
                    if(datacode == 'hubei'){//湖北地图文件襄樊市改为襄阳市
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