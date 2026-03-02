<template>
  <view class="container">
    <view class="content">
      <view class="image-container" @click="previewImage">
        <image src="/static/2601ZH442.png" class="route-map-image" mode="aspectFit" />
        <view class="preview-hint">点击查看大图</view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
    };
  },
  onLoad() {
  },
  methods: {
    // 使用uni.previewImage预览图片
    previewImage() {
      uni.previewImage({
        urls: ['/static/2601ZH442.png'],
        current: 0,
        success: function(res) {
          console.log('预览图片成功');
        },
        fail: function(res) {
          console.log('预览图片失败', res);
        }
      });
    }
  }
};
</script>

<style>
.container {
  padding: 40rpx 20rpx 120rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.content {
  background-color: white;
  border-radius: 10rpx;
  padding: 20rpx;
  text-align: center;
  font-size: 32rpx;
  color: #666;
  min-height: 500rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.image-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 500rpx;
  cursor: pointer;
}

.route-map-image {
  width: 100%;
  height: 100%;
  min-height: 500rpx;
  border-radius: 5rpx;
  object-fit: contain;
}

.preview-hint {
  position: absolute;
  bottom: 0rpx;
  left: 0rpx;
  right: 0rpx;
  text-align: center;
  color: white;
  font-size: 28rpx;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10rpx;
  border-radius: 5rpx;
}
</style>