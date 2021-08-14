<template>
  <div id="mapdiv" class="mapdiv"></div>

  <div id="logoDiv" class="esri-widget">Logo</div>
  <div id="toolbarDiv" class="esri-component esri-widget">
    <button
      id="distance"
      class="esri-widget--button esri-interactive esri-icon-measure-line"
      title="Distance Measurement Tool"
    ></button>
    <button
      id="area"
      class="esri-widget--button esri-interactive esri-icon-measure-area"
      title="Area Measurement Tool"
    ></button>
    <button
      id="faultManager"
      class="esri-widget--button esri-interactive esri-icon-trash"
      title="故障管理"
    ></button>
  </div>
  <div id="signalDiv" class="esri-component esri-widget">
    <button
      id="addSignal"
      class="esri-widget--button esri-interactive esri-icon-measure-line"
      title="增加信号节点"
    ></button>
    <button
      id="addGreenWave"
      class="esri-widget--button esri-interactive esri-icon-measure-area"
      title="增加绿波带"
    ></button>
    <button
      id="addRegion"
      class="esri-widget--button esri-interactive esri-icon-measure-area"
      title="增加区域"
    ></button>
    <button
      id="addSubRegion"
      class="esri-widget--button esri-interactive esri-icon-measure-area"
      title="增加子区"
    ></button>
    <button
      id="addGuard"
      class="esri-widget--button esri-interactive esri-icon-measure-area"
      title="增加警卫任务管理"
    ></button>
    <button
      id="clearSignal"
      class="esri-widget--button esri-interactive esri-icon-trash"
      title="清空操作"
    ></button>
  </div>
</template>

<script>
import Map from "@arcgis/core/Map";
import WebMap from "@arcgis/core/WebMap";
import Sketch from "@arcgis/core/widgets/Sketch";
import Expand from "@arcgis/core/widgets/Expand";
import Legend from "@arcgis/core/widgets/Legend";
import OpenStreetMapLayer from "@arcgis/core/layers/OpenStreetMapLayer";
import Search from "@arcgis/core/widgets/Search";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import * as echarts from "echarts";
// import TemplateRender from "vue-template-render";

let echartsInfos = [];

export default {
  name: "App",
  data() {
    return {
      outerVisible: false,
      innerVisible: false,
    };
  },
  /**************************
   * VUE的生命周期中，正常
   * beforeCreate - created - beforeMount -
   * mounted - beforeUpdate - updated -
   * beforeUnmount - unMounted
   */
  async mounted() {
    const webMap = new Map({
      basemap: "dark-gray-vector",
    });

    const mapView = new MapView({
      container: "mapdiv",
      center: [118.05, 24.56], //Longitude, latitude
      zoom: 13,
      map: webMap,
    });
    const osmLayer = new OpenStreetMapLayer();
    webMap.add(osmLayer);
    // places the logo div in the bottom right corner of the view
    mapView.ui.add("logoDiv", "bottom-right");
    const search = new Search({
      view: mapView,
    });
    // places the search widget in the top right corner of the view
    mapView.ui.add(search, "top-right");
    mapView.ui.remove(["attribution"]);

    // add a legend widget instance to the view
    // and set the style to 'card'. This is a
    // responsive style, which is good for mobile devices

    const legend = new Expand({
      content: new Legend({
        view: mapView,
        style: "card", // other styles include 'classic'
      }),
      view: mapView,
      expanded: true,
    });
    mapView.ui.add(legend, "bottom-left");
    /**********************
     * 增加业务图层
     */
    const graphicsPointLayer = new GraphicsLayer();
    webMap.add(graphicsPointLayer);
    const graphicsGuardLayer = new GraphicsLayer();
    webMap.add(graphicsGuardLayer);
    const graphicsRegionLayer = new GraphicsLayer();
    webMap.add(graphicsRegionLayer);
    const graphicsSubRegionLayer = new GraphicsLayer();
    webMap.add(graphicsSubRegionLayer);

    const sketchGraphicsLayer = new GraphicsLayer();
    webMap.add(sketchGraphicsLayer);

    /*************************
     * 地图加载完成后，执行部分
     */
    await mapView.when(
      () => {
        let that = this;
        console.log("地图加载成功");
        this.initPoint(graphicsPointLayer);
        this.initGuard(graphicsGuardLayer);
        this.initRegion(graphicsRegionLayer);
        this.initSubRegion(graphicsSubRegionLayer);
        //监听地图变化事件，刷新统计图位置
        mapView.watch("extent", function () {
          that.relocatePopup(mapView);
        });
        mapView.watch("rotation", function () {
          that.relocatePopup(mapView);
        });
        //地图加载完，初始化统计图
        this.echartsMapInit(mapView);

        // this.initDIVElement();
      },
      function (error) {
        console.log(error);
      }
    );
    mapView.on("click", function (event) {
      mapView.hitTest(event).then(function (response) {
        if (response.results.length) {
          let graphic = response.results.filter(function (result) {
            return result.graphic.layer === graphicsPointLayer;
          })[0].graphic;

          console.log(graphic.attributes);
        }
      });
    });
  },
  methods: {
    getAnswer() {
      this.outerVisible = true;
    },
    //统计图窗口位置
    relocatePopup(view) {
      for (var i = 0; i < echartsInfos.length; i++) {
        var echartsInfo = echartsInfos[i];
        //坐标转换
        var mapPoint = {
          x: echartsInfo.x,
          y: echartsInfo.y,
          //spatialReference: view.spatialReference
          spatialReference: {
            wkid: 4326,
          },
        };
        var screenPoint = view.toScreen(mapPoint);
        var obj = {};
        obj.x = screenPoint.x;
        obj.y = screenPoint.y;
        obj.option = echartsInfo.option;
        obj.id = echartsInfo.id;
        obj.echartsObj = echartsInfo.echartsObj;

        this.positionEchartsMap(obj,view);
      }
    },

    //调整图表位置及大小函数
    positionEchartsMap(obj,view) {
      document.getElementById(obj.id).style.transform = "translate3d(" + obj.x + "px, " + obj.y + "px, 0)"

      switch (view.zoom) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          document.getElementById(obj.id).style.height = "50px";
          document.getElementById(obj.id).style.width ="100px";
          break;
        case 6:
        case 7:
        case 8:
          document.getElementById(obj.id).style.height= "120px";
          document.getElementById(obj.id).style.width ="200px";
          break;
        case 9:
        case 10:
          document.getElementById(obj.id).style.height="150px";
          document.getElementById(obj.id).style.width ="300px";
          break;
        case 11:
        case 12:
          document.getElementById(obj.id).style.height="200px";
          document.getElementById(obj.id).style.width = "350px";
          break;
        default:
          document.getElementById(obj.id).style.height="250px";
          document.getElementById(obj.id).style.width ="400px";
      }
      if (obj.echartsObj) {
        obj.echartsObj.resize();
      }
    },
    //初始化图表信息函数
    echartsMapInit(view) {
      echartsInfos = []; //绘制函数里定义一个存放图表配置的全局数组
      echartsInfos.push({
        x: 118.05987, //图表在地图上绘制的位置-118.821527826096, 34.0139576938577
        y: 24.56720,
        content: `<div id="info1" style="height:150px;width:300px;position:absolute;"></div>`, //存放图表的DOM元素
        id: "info1",
        echartsObj: null,
        option: {
          //图表的配置信息，具体参数可到eCharts官网查看
          color: ["#3398DB"],
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "shadow",
            },
          },
          grid: {
            left: "3%",
            right: "4%",
            bottom: "3%",
            top: "3%",
            containLabel: true,
          },
          xAxis: [
            {
              type: "category",
              data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              axisTick: {
                alignWithLabel: true,
              },
              axisLabel: {
                interval: 0,
                rotate: -30,
              },
              axisLine: {
                lineStyle: {
                  color: "#FFFFFF",
                  width: 1,
                },
              },
            },
          ],
          yAxis: [
            {
              type: "value",
              splitLine: {
                lineStyle: {
                  color: ["#0087ED"],
                },
              },
              nameTextStyle: {
                color: ["#FFFFFF"],
              },
              axisLine: {
                lineStyle: {
                  color: "#FFFFFF",
                  width: 1,
                },
              },
            },
          ],
          series: [
            {
              name: "直接访问",
              type: "bar",
              barWidth: "60%",
              data: [10, 52, 200, 334, 390, 330, 220],
            },
          ],
        },
      });

      echartsInfos.push({
        //需要绘制的第二个图表的相关信息 -118.821527826096, 34.0139576938577
        x: 117.05961,
        y: 25.56570,
        content: `<div id="info2" style="height:150px;width:300px;position:absolute;"></div>`,
        id: "info2",
        echartsObj: null,
        option: {
          title: {
            text: "",
          },
          tooltip: {
            trigger: "axis",
            axisPointer: {
              type: "cross",
              label: {
                backgroundColor: "#6a7985",
              },
            },
          },
          legend: {
            data: ["视频广告", "直接访问", "搜索引擎"],
            textStyle: {
              color: ["#FFFFFF"],
            },
          },
          toolbox: {
            feature: {
              saveAsImage: {},
            },
          },
          grid: {
            left: "3%",
            right: "4%",
            bottom: "3%",
            top: "10%",
            containLabel: true,
          },
          xAxis: [
            {
              type: "category",
              boundaryGap: false,
              data: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
              nameTextStyle: {
                color: ["#FFFFFF"],
              },
              axisLine: {
                lineStyle: {
                  color: "#FFFFFF",
                  width: 1,
                },
              },
            },
          ],
          yAxis: [
            {
              type: "value",
              nameTextStyle: {
                color: ["#FFFFFF"],
              },
              axisLine: {
                lineStyle: {
                  color: "#FFFFFF",
                  width: 1,
                },
              },
            },
          ],
          series: [
            {
              name: "视频广告",
              type: "line",
              stack: "总量",
              areaStyle: {},
              data: [150, 232, 201, 154, 190, 330, 410],
            },
            {
              name: "直接访问",
              type: "line",
              stack: "总量",
              areaStyle: { normal: {} },
              data: [320, 332, 301, 334, 390, 330, 320],
            },
            {
              name: "搜索引擎",
              type: "line",
              stack: "总量",
              label: {
                normal: {
                  show: true,
                  position: "top",
                },
              },
              areaStyle: { normal: {} },
              data: [820, 932, 901, 934, 1290, 1330, 1320],
            },
          ],
        },
      });

      for (var i = 0; i < echartsInfos.length; i++) {
        var echartsInfo = echartsInfos[i];

        var mapPoint = {
          //坐标转换，将地理坐标转为屏幕坐标
          x: echartsInfo.x,
          y: echartsInfo.y,
          // spatialReference: {
          //     wkid: view.spatialReference.wkid
          // }
          spatialReference: {
            wkid: 4326,
          },
        };
        var screenPoint = view.toScreen(mapPoint);
        var obj = {}; //重新定义一个图表配置信息的对象
        obj.x = screenPoint.x;
        obj.y = screenPoint.y;
        obj.content = echartsInfo.content;
        obj.id = echartsInfo.id;
        obj.option = echartsInfo.option;
        obj.echartsObj = echartsInfo.echartsObj;
        echartsInfos[i].echartsObj = this.loadEchartsMap(obj,view);
      }
    },

    //绘制图表函数
    loadEchartsMap(obj,view) {
      let doms = this.parseToDOM(obj)
      console.log(doms)
     document.getElementById("mapdiv").appendChild(doms); //往mapview追加存放图表的DOM元素

      var dom = document.getElementById(obj.id); //绘制图表
      var myChart = echarts.init(dom);
      myChart.setOption(obj.option);

      this.positionEchartsMap(obj,view); //调整图表位置及大小
      return myChart;
    },
    parseToDOM(obj){
      var div = document.createElement("div");
      div.setAttribute("id",obj.id)
      div.setAttribute("style","height:150px;width:300px;position:absolute;")
      // if(typeof str == "string")
      //     div = str;
      return div;
    },
    mapInit(mapView) {
      var chartDom = document.getElementById("info1");
      var myChart = echarts.init(chartDom);
      var option;

      option = {
        xAxis: {
          type: "category",
          data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        },
        yAxis: {
          type: "value",
        },
        series: [
          {
            data: [120, 200, 150, 80, 70, 110, 130],
            type: "bar",
          },
        ],
      };

      option && myChart.setOption(option);
    },
    initDIVElement() {
      //options
      const vueTemplate2 = `
          <div><span v-for="i in 10">{{msg}} --- {{ i }}</span></div>
          `;
      //# 输出 dom
      console.log(
        TemplateRender.render(vueTemplate2, { data: { msg: "hello" } })
      );
      //# 输出 html
      console.log(
        TemplateRender.render(vueTemplate2, { data: { msg: "hello" } })
          .outerHTML
      );
    },
    initPoint(graphicsLayer) {
      const point = {
        //Create a point
        type: "point",
        longitude: -118.80657463861,
        latitude: 34.0005930608889,
      };
      const simpleMarkerSymbol = {
        type: "simple-marker",
        color: [226, 119, 40], // Orange
        outline: {
          color: [255, 255, 255], // White
          width: 1,
        },
      };
      const popupTemplate = {
        title: "{Name}",
        content: "{Description}",
      };
      const attributes = {
        Name: "Graphic",
        Description: "I am a polygon",
      };
      const pointGraphic = new Graphic({
        geometry: point,
        symbol: simpleMarkerSymbol,
        attributes: attributes,
        popupTemplate: popupTemplate,
      });
      graphicsLayer.add(pointGraphic);
    },
    initGuard(graphicsLayer) {
      // Create a line geometry
      const polyline = {
        type: "polyline",
        paths: [
          [-118.821527826096, 34.0139576938577], //Longitude, latitude
          [-118.814893761649, 34.0080602407843], //Longitude, latitude
          [-118.808878330345, 34.0016642996246], //Longitude, latitude
        ],
      };
      const simpleLineSymbol = {
        type: "simple-line",
        color: [226, 119, 40], // Orange
        width: 2,
      };

      const polylineGraphic = new Graphic({
        geometry: polyline,
        symbol: simpleLineSymbol,
      });
      graphicsLayer.add(polylineGraphic);
    },
    initRegion(graphicsLayer) {
      // Create a polygon geometry
      const polygon = {
        type: "polygon",
        rings: [
          [-118.818984489994, 34.0137559967283], //Longitude, latitude
          [-118.806796597377, 34.0215816298725], //Longitude, latitude
          [-118.791432890735, 34.0163883241613], //Longitude, latitude
          [-118.79596686535, 34.008564864635], //Longitude, latitude
          [-118.808558110679, 34.0035027131376], //Longitude, latitude
        ],
      };

      const simpleFillSymbol = {
        type: "simple-fill",
        color: [227, 139, 79, 0.8], // Orange, opacity 80%
        outline: {
          color: [255, 255, 255],
          width: 1,
        },
      };
      const popupTemplate = {
        title: "{Name}",
        content: "{Description}",
      };
      const attributes = {
        Name: "Graphic",
        Description: "I am a polygon",
      };
      const polygonGraphic = new Graphic({
        geometry: polygon,
        symbol: simpleFillSymbol,
        attributes: attributes,
        popupTemplate: popupTemplate,
      });
      graphicsLayer.add(polygonGraphic);
    },
    initSubRegion(graphicsLayer) {
      // Create a polygon geometry
      const polygon = {
        type: "polygon",
        rings: [
          [-118.828984489994, 34.0437559967283], //Longitude, latitude
          [-118.836796597377, 34.0515816298725], //Longitude, latitude
          [-118.761432890735, 34.0063883241613], //Longitude, latitude
          [-118.76596686535, 34.008564864635], //Longitude, latitude
          [-118.808558110679, 34.0135027131376], //Longitude, latitude
        ],
      };

      const simpleFillSymbol = {
        type: "simple-fill",
        color: [227, 139, 79, 0.8], // Orange, opacity 80%
        outline: {
          color: [255, 255, 255],
          width: 1,
        },
      };
      const popupTemplate = {
        title: "{Name}",
        content: "{Description}",
      };
      const attributes = {
        Name: "Graphic",
        Description: "I am a polygon",
      };
      const polygonGraphic = new Graphic({
        geometry: polygon,
        symbol: simpleFillSymbol,
        attributes: attributes,
        popupTemplate: popupTemplate,
      });
      graphicsLayer.add(polygonGraphic);
    },
  },
};
</script>

<style>
html,
body,
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}

.mapdiv {
  padding: 0;
  margin: 0;
  height: 100%;
}
.transition-box {
  margin-bottom: 10px;
  width: 200px;
  height: 100px;
  border-radius: 4px;
  background-color: #409eff;
  text-align: center;
  color: #fff;
  padding: 40px 20px;
  box-sizing: border-box;
  margin-right: 20px;
}

.search,
.logo {
  position: absolute;
  right: 15px;
}

.search {
  top: 15px;
}

.logo {
  bottom: 30px;
}
#toolbarDiv {
  position: absolute;
  top: 15px;
  left: 60px;
  cursor: default;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}
#signalDiv {
  position: absolute;
  top: 15px;
  left: 170px;
  cursor: default;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}
.echarts {
  height: 150px;
  width: 300px;
  position: absolute;
}
</style>
