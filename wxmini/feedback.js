var util = require('../../../utils/util.js');
var api = require('../../../config/api.js');

var app = getApp();
//创建audio控件
const myaudio = wx.createInnerAudioContext(); 

Page({
  data: {
    array: ['请选择话题类型', '读书相关', '食宿相关', '课外活动', '同学相关', '老师相关', '美食', '其他'],
    index: 0,
    content:'',
    contentLength:0,
    // 图片列表
    images: [],
    ossImages: [],
    // 音频列表
    records:[],
    audKey:'',  //当前选中的音频key
    ossRecords:[],
    // 视频
    video: '',
    ossVideo: [],
    mobile:'',
 
    lastVoiceYPostion: 0,
    showVoiceMask: false,
    startRecording: false,
    cancleRecording:false
  },
  // 图片操作的具体函数
  ImageOperator() {
    wx.chooseImage({
      count: 9,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        // 当前上传的图片数据
        const imgList = res.tempFilePaths;
        // 原来的图片数据
        const imageList = this.data.images;

        // 原来的图片数量
        let imageLenght = imageList.length;
        // 当前的图片数量
        let nowLenght = imgList.length;
        console.log(imageLenght);

        if (imageLenght == 9) {
          console.log("数量已经有9张，请删除再添加...");
        }
        if (imageLenght < 9) {
          let images = [];
          let ossImages = this.data.ossImages;
          // 获取缺少的图片张数
          let residue = 9 - imageLenght;
          // 如果缺少的张数大于当前的的张数, 保证9张图片
          if (residue >= nowLenght) {
            // 直接将两个数组合并为一个  
            images = imageList.concat(imgList);
          } else {
            // 否则截取当前的数组一部分，超过9张数量部分不要，如这次选5张，但只能存3张，后2张不要
            images = imageList.concat(imgList.slice(0, residue));
            nowLenght = residue;
          }

          for (let i = 0; i < nowLenght; i++) {
            let that = this;
            let imgUrl = res.tempFilePaths[i];
            wx.uploadFile({
              //上传的网路请求地址
              url: api.FileUpload,
              //选择
              filePath: imgUrl,
              name: 'file',
              header: {
                "Content-Type": "multipart/form-data",
                'accept': 'application/json'
              },
              formData: {
                'file': imgUrl
              },
  
              success: function (res) {
                ossImages.push(res.data);
                console.log("success");
              },
  
              fail: function (res) {
                console.log("error:" + res.msg);
              }
            });
          }
          console.log("save string:" + ossImages);
          this.setData({
            images, ossImages
          })
        }
      }
    })

  },
  // 图片获取
  chooseImage() {
    if (this.data.images.length == 0) {
      wx.showToast({
        title: '请上传最多9张图片!',
        icon: 'none',
        duration: 2000,
        success: res => {
          this.ImageOperator()
        }
      })
    } else {
      this.ImageOperator()
    }

  },
  // 删除图片
  deleteImage(event) {
    //获取数据绑定的data-id的数据
    const nowIndex = event.currentTarget.dataset.id;
    let images = this.data.images;
    images.splice(nowIndex, 1);
    let ossImages = this.data.ossImages;
    ossImages.splice(nowIndex, 1);
    this.setData({
      images, ossImages
    })
  },
  // 预览图片
  previewIamge(event) {
    const nowIndex = event.currentTarget.dataset.id;
    const images = this.data.images;
    wx.previewImage({
      current: images[nowIndex],  //当前预览的图片
      urls: images,  //所有要预览的图片
    })
  },
  // 语音获取
  chooseRecord() {
    if (this.data.records.length == 0) {
      wx.showToast({
        title: '最多录制9段语音!',
        icon: 'none',
        duration: 2000,
        success: res => {
          this.setData({showVoiceMask:true})
        }
      })
    } else {
      this.setData({showVoiceMask:true})
    }

  },
  // 删除语音
  deleteRecord(event) {
    //获取数据绑定的data-id的数据
    const nowIndex = event.currentTarget.dataset.id;
    let records = this.data.records;
    records.splice(nowIndex, 1);
    let ossRecords = this.data.ossRecords;
    ossRecords.splice(nowIndex, 1);
    this.setData({
      records, ossRecords
    })
  },
  //音频播放  
  audioPlay(e) {
    var that = this,
      key = e.currentTarget.dataset.key,
      audioArr = that.data.records;
  
    //设置状态
    audioArr.forEach((v, i, array) => {
      v.bl = false;
      if (i == key) {
        v.bl = true;
      }
    })
    that.setData({
      records: audioArr,
      audKey: key,
    })

    myaudio.autoplay = true;
    var audKey = that.data.audKey;
    var vidSrc = audioArr[audKey].src;
    myaudio.src = vidSrc;
    
    myaudio.play();

    //开始监听
    myaudio.onPlay(() => {
      console.log('开始播放');
    })

    //结束监听
    myaudio.onEnded(() => {
      console.log('自动播放完毕');
      audioArr[key].bl = false;
      that.setData({
        records: audioArr,
      })
    })

    //错误回调
    myaudio.onError((err) => {
      console.log(err); 
      audioArr[key].bl = false;
      that.setData({
        records: audioArr,
      })
      return
    })

  },

  // 音频停止
  audioStop(e){
    var that = this,
      audioArr = that.data.records;
    //设置状态
    audioArr.forEach((v, i, array) => {
      v.bl = false;
    })
    that.setData({
      records: audioArr
    })

    myaudio.stop();

    //停止监听
    myaudio.onStop(() => {
      console.log('停止播放');
    })

  }, 
  // 隐藏录音界面
  hideVoiceMask:function () {
    this.setData({
      showVoiceMask: false,
      startRecording: false,
      cancleRecording:false
    })
  },
  // 开始录音
  startRecording:function (e) {
    // 原来的录音数据
    let records = this.data.records;
    // 原来的录音数量
    let recordLenght = records.length;
    console.log(recordLenght);
    if (recordLenght == 9) {
      console.log("已经有9个录音，请删除再添加...");
      return;
    }
    console.log('开始录音');
    this.setData({
      startRecording:true
    })
    this.startVoiceRecordAnimation();
    var that = this;
    const recorderManager = wx.getRecorderManager();
    recorderManager.start({
      format: 'mp3',
    });
    recorderManager.onStart(() => {
      console.log('recorder start')
    })
  },
  // 结束录音
  stopRecording: function (e) {
    console.log('结束录音');
    var that = this;
    const recorderManager = wx.getRecorderManager();
    recorderManager.stop();
    recorderManager.onStop((res) => {
      console.log('recorder stop', res)
      const { tempFilePath } = res;
      if (res.duration < 1000) {
        wx.showToast({
          title: '说话时间太短!',
          icon:'none'
        })
        this.stopVoiceRecordAnimation();
        that.setData({
          startRecording: false
        })
        return;
      }
      if (this.data.cancleRecording === false) {
        if (tempFilePath.length !== 0) {
          var recordLength = 0;
          let ossRecords = this.data.ossRecords;
          let records = this.data.records;
          if (res.duration / 1000 < 22) {
            recordLength = 160;
          } else {
            recordLength = (res.duration / 1000) / 60 * 440;
          }
          var recordTime = (res.duration / 1000 + 1).toFixed(0) + 's';
          var record = [{
            id:util.wxuuid(),
            src:tempFilePath,
            time:recordTime,
            bl:false
          }]; 
          records = records.concat(record);
          console.log('recordLength:' + recordLength);
          wx.uploadFile({
            //上传的网路请求地址
            url: api.FileUpload,
            //选择
            filePath: tempFilePath,
            name: 'file',
            header: {
              "Content-Type": "multipart/form-data",
              'accept': 'application/json'
            },
            formData: {
              'file': tempFilePath
            },

            success: function (res) {
              ossRecords.push(res.data);
              console.log("success");
            },

            fail: function (res) {
              console.log("error:" + res.msg);
            }
          });
          that.setData({
            records,
            ossRecords,
            selectResource: true,
            showVoiceMask: false,
            startRecording: false
          })
          that.stopVoiceRecordAnimation();
        }
      } else {
        that.setData({
          showVoiceMask: false,
          startRecording: false,
          cancleRecording:false
        })
        that.stopVoiceRecordAnimation();
      }
    })
  },
  //向上滑动取消录音
  moveToCancle: function (event) {
    let currentY = event.touches[0].pageY;
    if (this.data.lastVoiceYPostion !== 0) {
      if (currentY - this.data.lastVoiceYPostion < 0 && currentY < 470) {
        this.setData({
          cancleRecording:true
        })
      }
    }
    this.setData({
      lastVoiceYPostion: currentY
    })
  },
  //麦克风帧动画
  startVoiceRecordAnimation:function () {
    var that = this;
    //话筒帧动画
    var i = 1;
    that.data.recordAnimationSetInter = setInterval(function () {
      i++;
      i = i % 5;
      that.setData({
        recordAnimationNum: i
      })
    }, 300);
  },
  // 停止麦克风动画计时器
  stopVoiceRecordAnimation:function () {
    var that = this;
    clearInterval(that.data.recordAnimationSetInter);
  },
  // 上传视频
  chooseVideo() {
    // 弹层  
    wx.showToast({
      title: '请上传最多1个视频!',
      icon: 'none',
      duration: 2000,
      success: res => {
        wx.chooseVideo({
          sourceType: ['album', 'camera'],
          compressed: false,
          maxDuration: 60,
          camera: 'back',
          success: res => {
            console.log(res);
            let ossVideo = this.data.ossVideo;

            if (res.duration > 60){
              util.showErrorToast('时间超过60秒');
              return false;
            } else {
              if (res.size > 25*1024*1024 -1){
                util.showErrorToast('大小超过25M');
                return false;
              }
            }
        
            wx.uploadFile({
              //上传的网路请求地址
              url: api.FileUpload,
              //选择
              filePath: res.tempFilePath,
              name: 'file',
              header: {
                "Content-Type": "multipart/form-data",
                'accept': 'application/json'
              },
              formData: {
                'file': res.tempFilePath
              },
   
              success: function (res) {
                ossVideo = ossVideo.push(res.data);
                console.log("success:" + ossVideo);
              },
   
              fail: function (res) {
                console.log("error:" + res.msg);
              }
            });
            const video = res.tempFilePath;
            console.log("save string:" + ossVideo);
            this.setData({ video }, ossVideo)
          }
        })
      }
    })
  },
  // 删除视频
  videoDelete() {
    wx.showModal({
      title: '警告',
      content: '确定要删除该视频吗',
      success: res => {
        if (res.confirm) {
          this.setData({
            video: '',
            ossVideo: []
          })
        }
      }
    })
  },
  bindPickerChange: function (e) {
    this.setData({
      index: e.detail.value
    });
  },
  mobileInput: function (e) {
    let that = this;
    this.setData({
      mobile: e.detail.value,
    });
  },
  contentInput: function (e) {   
    let that = this;
    this.setData({
      contentLength: e.detail.cursor,
      content: e.detail.value,
    });
  },
  cleanMobile:function(){
    let that = this;

  },
  sbmitFeedback : function(e){
    let that = this;
    if (that.data.index == 0){
      util.showErrorToast('请选择反馈类型');
      return false;
    }

    if (that.data.content == '') {
      util.showErrorToast('请输入反馈内容');
      return false;
    }

    if (that.data.mobile == '' || that.data.mobile.length < 11 ) {
      util.showErrorToast('请输入手机号码');
      return false;
    }
    
    wx.showLoading({
      title: '提交中...',
      mask:true,
      success: function () {

      }
    });

    util.request(api.MultimediaAdd, { mobile: that.data.mobile, index: that.data.index, content: that.data.content, image: that.data.ossImages, record: that.data.ossRecords, video: that.data.ossVideo},'POST', 'application/json').then(function (res) {
      if (res.errno === 0) {

        wx.hideLoading();

        wx.showToast({
          title: res.data,
          icon: 'success',
          duration: 2000,
          complete: function () {
            that.setData({
              index: 0,
              content: '',
              contentLength: 0,
              mobile: '',
              video: '',
              ossVideo: [],
              ossRecords: [],
              records:[],
              ossImages: [],
              images:[]
            });
          }
        });
      } else {
        util.showErrorToast(res.errmsg);
      }
      
    });
  },
  onLoad: function (options) {
  },
  onReady: function () {

  },
  onShow: function () {

  },
  onHide: function () {
    // 页面隐藏

  },
  onUnload: function () {
    // 页面关闭
  }
})