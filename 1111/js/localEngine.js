// 处理按专辑分类的音乐数据
var flattenedLocalMusic = [];
var albums = []; // 存储专辑信息
var isLastSongInListMode = false; // 是否在顺序播放模式的最后一首歌
console.log('localEngine.js loaded');

// 检查 localMusic 是否定义
if (typeof localMusic === 'undefined') {
  console.warn('localMusic is not defined, using empty array');
  var localMusic = [];
}

console.log('localMusic:', localMusic);
if (Array.isArray(localMusic)) {
  // 检查是否是新的按专辑分类的格式
  if (localMusic.length > 0 && localMusic[0].albumName && localMusic[0].songs) {
    // 新格式：按专辑分类
    console.log('Using new album format');
    localMusic.forEach(album => {
      if (album.songs && Array.isArray(album.songs)) {
        // 只使用JSON文件中手动配置的封面，不再自动生成
        const albumCoverPath = album.cover;
        
        // 保存专辑信息
        albums.push({
          name: album.albumName,
          cover: albumCoverPath,
          artist: album.artist || '未知艺术家', // 添加专辑艺术家信息
          songs: album.songs
        });
        
        album.songs.forEach(song => {
          flattenedLocalMusic.push({
            name: song.title,
            artist: song.artist || album.artist || '未知艺术家', // 如果歌曲没有artist字段，则使用专辑级别的artist
            url: song.url,
            cover: song.cover || albumCoverPath, // 如果歌曲有单独封面则使用，否则使用专辑封面
            lrc: song.lrc,
            album: album.albumName // 添加专辑信息
          });
        });
      }
    });
  } else {
    // 旧格式：简单歌曲数组
    console.log('Using old array format');
    flattenedLocalMusic = localMusic;
  }
} else {
  console.error('localMusic is not an array');
  flattenedLocalMusic = [];
}

console.log('flattenedLocalMusic:', flattenedLocalMusic);
console.log('albums:', albums);

var encodedLocalMusic = flattenedLocalMusic.map(item => ({
  name: item.name,
  artist: item.artist,
  url: encodeNonAscii(item.url), // 使用encodeNonAscii函数处理URL
  cover: encodeNonAscii(item.cover), // 使用encodeNonAscii函数处理封面URL
  lrc: encodeNonAscii(item.lrc) // 使用encodeNonAscii函数处理歌词URL
}));

console.log('encodedLocalMusic:', encodedLocalMusic);

document.getElementById('heoMusic-page').classList.add('localMusic');

function encodeNonAscii(str) {
  if (!str) return '';
  
  // 只对URL中的空格进行编码，保留中文字符不变
  return str.replace(/ /g, '%20');
}

// 声明全局变量ap
console.log('Initializing APlayer...');
window.ap = new APlayer({
  container: document.getElementById('heoMusic-page'),
  lrcType: 3,
  audio: encodedLocalMusic,
  listFolded: window.innerWidth < 768 ? true : false,
  order: false, // 禁用默认的播放顺序按钮
  loop: false, // 禁用默认的循环按钮
  // 优化预加载策略，不自动加载音频文件
  preload: 'none', // 改为不预加载，改为按需加载
  autoplay: false // 不自动播放
});
console.log('APlayer initialized:', window.ap);

// 触发自定义事件，通知APlayer已初始化完成
if (typeof window.CustomEvent === 'function') {
  const aplayerReadyEvent = new CustomEvent('aplayerReady', {
    detail: { aplayer: window.ap }
  });
  window.dispatchEvent(aplayerReadyEvent);
  console.log('APlayer就绪事件已触发');
} else {
  // 如果浏览器不支持CustomEvent，使用传统方式
  console.log('APlayer已初始化完成');
}

// 确保heo对象已定义再调用setupMediaSessionHandlers
if (typeof heo !== 'undefined' && typeof heo.setupMediaSessionHandlers === 'function') {
  heo.setupMediaSessionHandlers(window.ap);
} else {
  console.log('heo对象尚未定义，稍后再设置MediaSession处理器');
}

// 创建专辑列表按钮和容器
function createAlbumList() {
  if (albums.length === 0) return;
  
  const heoMusicPage = document.getElementById('heoMusic-page');
  
  // 等待APlayer初始化完成
  setTimeout(() => {
    // 查找APlayer的主体元素
    const aplayerBody = document.querySelector('.aplayer-body');
    if (!aplayerBody) return;
    
    // 创建专辑列表按钮
    const albumButton = document.createElement('button');
    albumButton.className = 'aplayer-icon aplayer-icon-album';
    albumButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" ><rect x="3" y="3" width="5" height="5" rx="0.5" fill="white" opacity="0.8"/><rect x="9.5" y="3" width="5" height="5" rx="0.5" fill="white" opacity="0.8"/><rect x="16" y="3" width="5" height="5" rx="0.5" fill="white" opacity="0.8"/><rect x="3" y="9.5" width="5" height="5" rx="0.5" fill="white" opacity="0.8"/><rect x="9.5" y="9.5" width="5" height="5" rx="0.5" fill="white" opacity="0.8"/><rect x="16" y="9.5" width="5" height="5" rx="0.5" fill="white" opacity="0.8"/><rect x="3" y="16" width="5" height="5" rx="0.5" fill="white" opacity="0.8"/><rect x="9.5" y="16" width="5" height="5" rx="0.5" fill="white" opacity="0.8"/><rect x="16" y="16" width="5" height="5" rx="0.5" fill="white" opacity="0.8"/></svg>';
    albumButton.style.cssText = `
      width: 24px;
     
      border: none;
      background: none;
      cursor: pointer;
      color: #666;
     
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
      flex-shrink: 0;
    `;
    
    // 添加悬停效果
    albumButton.addEventListener('mouseenter', function() {
      this.style.color = '#1e88e5';
    });
    
    albumButton.addEventListener('mouseleave', function() {
      this.style.color = '#666';
    });

    // 创建二维码按钮
    const qrButton = document.createElement('button');
    qrButton.className = 'aplayer-icon aplayer-icon-qr';
    qrButton.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
      </svg>
    `;
    qrButton.style.cssText = `
      width: 24px;
      border: none;
      background: none;
      cursor: pointer;
      color: #666;
    
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
      flex-shrink: 0;
    `;
    
    // 添加二维码按钮悬停效果
    qrButton.addEventListener('mouseenter', function() {
      this.style.color = '#1e88e5';
    });
    
    qrButton.addEventListener('mouseleave', function() {
      this.style.color = '#666';
    });
    
    // 将专辑按钮添加到播放器时间控制区域
    const aplayerTime = document.querySelector('.aplayer-time');
    if (aplayerTime) {
      aplayerTime.appendChild(albumButton);
      aplayerTime.appendChild(qrButton); // 添加二维码按钮
    }



    // 二维码弹窗 - 完全模仿APlayer列表结构
    const qrModal = document.createElement('div');
    qrModal.className = 'qr-modal';
    qrModal.style.cssText = `
      position: fixed;
      z-index: 1003;
      width: 100vw;
      top: 0px;
      left: 0;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 0px 0px 20px 20px;
      padding: 20px 0px;
      max-width: 100vw;
      height: calc(100dvh - 240px);
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
      border-top: none;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-origin: top center;
      display: none;
      opacity: 0;
      transform: scaleY(0.8);
    `;
    
    // 初始状态添加隐藏类（确保第一次点击有动画）
    qrModal.classList.add('qr-modal-hide');

    // 创建二维码容器
    const qrContainer = document.createElement('div');
    qrContainer.style.cssText = `
      padding: 30px;
      text-align: center;
      max-width: 90vw;
      max-height: 90vh;
      margin: 50px auto;
    `;

    // 创建标题
    const qrTitle = document.createElement('h3');
    qrTitle.textContent = '上传歌曲至网易云盘';
    qrTitle.style.cssText = `
      margin: 0 0 20px 0;
      color: #fff;
      font-size: 20px;
      font-weight: 500;
    `;

    // 创建二维码图片
    const qrImage = document.createElement('img');
    qrImage.src = 'img/xcx.jpg'; // 使用真实的小程序二维码
    qrImage.alt = '小程序二维码';
    qrImage.style.cssText = `
      width: 200px;
      height: 200px;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      object-fit: cover;
    `;

    // 创建说明文字
    const qrDescription = document.createElement('p');
    qrDescription.textContent = '扫码使用小程序上传歌曲';
    qrDescription.style.cssText = `
      margin: 20px 0 0 0;
      color: #fff;
      font-size: 16px;
      line-height: 1.5;
    `;

    // 创建使用指南链接
    const qrGuideLink = document.createElement('a');
    qrGuideLink.textContent = '使用指南';
    qrGuideLink.href = 'https://mp.weixin.qq.com/s/pHsFSPTn3Cd7MXV81J4NHg';
    qrGuideLink.target = '_blank';
    qrGuideLink.style.cssText = `
      display: inline-block;
      margin-top: 15px;
      padding: 8px 16px;
      background: #3385ff;
      color: white;
      text-decoration: none;
      border-radius: 20px;
      font-size: 14px;
      transition: background 0.3s ease;
    `;

    // 添加链接悬停效果
    qrGuideLink.addEventListener('mouseenter', function() {
      this.style.background = '#1a6cff';
    });

    qrGuideLink.addEventListener('mouseleave', function() {
      this.style.background = '#3385ff';
    });

    // 创建主页按钮
    const qrHomeButton = document.createElement('a');
    qrHomeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';
    qrHomeButton.href = 'https://1701701.xyz/';
    qrHomeButton.target = '_blank';
    qrHomeButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 1004;
      text-decoration: none;
    `;

    // 主页按钮悬停效果
    qrHomeButton.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
    });

    qrHomeButton.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
    });

    // 组装弹窗
    qrModal.appendChild(qrContainer);
    qrModal.appendChild(qrHomeButton);
    document.body.appendChild(qrModal);

    // 二维码弹窗显示/隐藏函数 - 使用类切换机制确保第一次点击也有动画
    function showQrModal() {
      // 先设置display，然后移除隐藏类来触发动画（模仿APlayer的机制）
      qrModal.style.display = 'block';
      
      // 强制重绘，确保display生效
      void qrModal.offsetHeight;
      
      // 移除隐藏类来触发动画
      qrModal.classList.remove('qr-modal-hide');
      
      // 添加内容到容器
      qrContainer.appendChild(qrTitle);
      qrContainer.appendChild(qrImage);
      qrContainer.appendChild(qrDescription);
      qrContainer.appendChild(qrGuideLink);
    }

    function hideQrModal() {
      // 添加隐藏类来触发动画
      qrModal.classList.add('qr-modal-hide');
      
      // 动画完成后隐藏元素
      setTimeout(() => {
        qrModal.style.display = 'none';
        // 清空容器内容
        qrContainer.innerHTML = '';
      }, 400);
    }

    // 二维码按钮点击事件
    qrButton.addEventListener('click', function(event) {
      event.stopPropagation();
      console.log('QR button clicked');
      
      // 只在移动端隐藏歌曲列表，电脑端保持显示
      if (window.innerWidth <= 768 && window.ap) {
        window.ap.list.hide();
      }
      if (albumListContainer && albumListContainer.style.display === 'block') {
        hideAlbumList();
      }
      
      // 切换二维码弹窗显示状态
      if (qrModal.style.display === 'none') {
        console.log('QR modal shown');
        showQrModal();
      } else {
        console.log('QR modal hidden');
        hideQrModal();
      }
    });

    // 点击弹窗背景关闭
    qrModal.addEventListener('click', function(event) {
      // 如果点击的是弹窗背景而不是内容区域，则关闭弹窗
      if (event.target === qrModal) {
        hideQrModal();
      }
    });
    
    // 点击页面其他地方关闭二维码弹窗
    document.addEventListener('click', function(event) {
      if (!qrModal.contains(event.target) && 
          !event.target.closest('.aplayer-icon-qr') && 
          qrModal.style.display === 'block') {
        
        hideQrModal();
      }
    });

    // 监听菜单按钮点击事件，关闭二维码弹窗
    document.addEventListener('click', function(event) {
      if (event.target.closest('.aplayer-icon-menu')) {
        if (qrModal && qrModal.style.display === 'block') {
          hideQrModal();
        }
      }
    });

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && qrModal.style.display === 'block') {
        hideQrModal();
      }
    });
    
    // 创建专辑列表容器 - 完全复制APlayer列表结构
    const albumListContainer = document.createElement('div');
    albumListContainer.className = 'aplayer-list album-list-container';
    albumListContainer.style.cssText = `
      position: fixed;
      z-index: 1003;
      width: 100vw;
      top: 0px;
      left: 0;
      border-radius: 0px 0px 20px 20px;
      
      max-width: 100vw;
      height: calc(100dvh - 240px);
      box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
     
      border-top: none;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      transform-origin: top center;
      display: none;
      overflow: visible; /* 修改为visible，让内容容器能够滚动 */
      padding: 20px 0px;
    `;
    
    // 初始状态添加隐藏类（确保第一次点击有动画）
    albumListContainer.classList.add('album-list-hide');
    
    // 创建专辑列表内容容器 - 完全模仿APlayer列表
const albumListContent = document.createElement('div');
albumListContent.className = 'album-list-content';
albumListContent.style.cssText = `
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding:0 20px;
  -webkit-overflow-scrolling: touch; /* 启用iOS平滑滚动 */
`;

// 创建专辑列表标题
const albumListTitle = document.createElement('div');
albumListTitle.className = 'album-list-title';
albumListTitle.textContent = '民谣俱乐部 专辑列表';
albumListTitle.style.cssText = `
  font-size: 24px;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
  margin: 20px 0 30px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 1px;
`;

// 创建专辑项网格布局 - 优化为每行显示四个专辑
const albumGrid = document.createElement('div');
albumGrid.className = 'album-grid';
albumGrid.style.cssText = `
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  justify-content: center;
  max-width: 800px;
  margin: 0 auto;
`;

// 创建底部提示信息容器
const albumListFooter = document.createElement('div');
albumListFooter.className = 'album-list-footer';
albumListFooter.style.cssText = `
  text-align: center;
  margin-top: 30px;
  padding: 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

// 创建提示信息
const warningText = document.createElement('div');
warningText.className = 'album-list-warning';
warningText.textContent = '1701701.xyz';
warningText.style.cssText = `
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 15px;
  line-height: 1.5;
`;

// 创建回到经典版链接
const classicLink = document.createElement('a');
classicLink.className = 'album-list-classic-link';
classicLink.href = 'https://1701701.xyz/';
classicLink.target = '_blank';
classicLink.rel = 'noopener noreferrer';
classicLink.textContent = '回到经典版';
classicLink.style.cssText = `
  display: inline-block;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

// 添加悬停效果
classicLink.addEventListener('mouseenter', function() {
  this.style.background = 'rgba(255, 255, 255, 0.2)';
  this.style.color = '#ffffff';
  this.style.transform = 'translateY(-2px)';
});

classicLink.addEventListener('mouseleave', function() {
  this.style.background = 'rgba(255, 255, 255, 0.1)';
  this.style.color = 'rgba(255, 255, 255, 0.9)';
  this.style.transform = 'translateY(0)';
});

// 组装底部内容
albumListFooter.appendChild(warningText);
albumListFooter.appendChild(classicLink);

// 组装专辑列表结构
albumListContent.appendChild(albumListTitle);
albumListContent.appendChild(albumGrid);
albumListContent.appendChild(albumListFooter);
albumListContainer.appendChild(albumListContent);
    
    // 专辑列表显示/隐藏函数 - 使用类切换机制确保第一次点击也有动画
function showAlbumList() {
  // 先设置display，然后移除隐藏类来触发动画（模仿APlayer的机制）
  albumListContainer.style.display = 'block';
  
  // 强制重绘，确保display生效
  void albumListContainer.offsetHeight;
  
  // 移除隐藏类来触发动画
  albumListContainer.classList.remove('album-list-hide');
  
  // 修复滚动问题：重置内容容器的滚动位置
  setTimeout(() => {
    if (albumListContent) {
      albumListContent.scrollTop = 0;
      // 强制重绘滚动容器
      void albumListContent.offsetHeight;
    }
  }, 10);
}

function hideAlbumList() {
  // 添加隐藏类来触发动画
  albumListContainer.classList.add('album-list-hide');
  
  // 动画完成后隐藏元素
  setTimeout(() => {
    albumListContainer.style.display = 'none';
  }, 400);
}
    
    // 添加专辑按钮点击事件
    albumButton.addEventListener('click', function(event) {
      event.stopPropagation(); // 阻止事件冒泡
      console.log('Album button clicked');
      
      // 只在移动端隐藏歌曲列表，电脑端保持显示
      if (window.innerWidth <= 768 && window.ap) {
        window.ap.list.hide();
      }
      
      // 隐藏二维码弹窗
      if (qrModal && qrModal.style.display === 'block') {
        hideQrModal();
      }
      
      // 切换专辑列表显示状态
      if (albumListContainer.style.display === 'none') {
        console.log('Album list shown');
        showAlbumList();
      } else {
        console.log('Album list hidden');
        hideAlbumList();
      }
    });
    
    
    
    // 点击专辑列表背景或内容区域关闭弹窗
    albumListContainer.addEventListener('click', function(event) {
      // 点击弹窗任何区域都可以关闭弹窗
      hideAlbumList();
    });
    
    // 点击页面其他地方关闭专辑列表
    document.addEventListener('click', function(event) {
      if (!albumListContainer.contains(event.target) && 
          !event.target.closest('.aplayer-icon-album') && 
          albumListContainer.style.display === 'block') {
        
        hideAlbumList();
      }
    });
    
    // 添加专辑项样式 - 优化专辑项样式
    const style = document.createElement('style');
    style.textContent = `
      /* 专辑列表隐藏状态 - 模仿APlayer的动画 */
      .album-list-hide {
        top: -100% !important;
        opacity: 0 !important;
        transform: scaleY(0.8) !important;
      }
      
      /* 专辑列表显示状态 */
      .album-list-container:not(.album-list-hide) {
        top: 0px !important;
        opacity: 1 !important;
        transform: scaleY(1) !important;
      }
      
      /* 添加遮罩层 - 模仿二维码弹窗 */
      .album-list-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        z-index: -1;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 0px 0px 20px 20px;
      }
      
      .album-list-container:not(.album-list-hide)::before {
        opacity: 1;
      }
      
      /* 二维码弹窗隐藏状态 - 模仿APlayer的动画 */
      .qr-modal-hide {
        top: -100% !important;
        opacity: 0 !important;
        transform: scaleY(0.8) !important;
      }
      
      /* 二维码弹窗显示状态 */
      .qr-modal:not(.qr-modal-hide) {
        top: 0px !important;
        opacity: 1 !important;
        transform: scaleY(1) !important;
      }
      
      /* 添加遮罩层 - 模仿APlayer列表 */
      .qr-modal::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        z-index: -1;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 0px 0px 20px 20px;
      }
      
      .qr-modal:not(.qr-modal-hide)::before {
        opacity: 1;
      }
      
      .album-list-container::-webkit-scrollbar {
        width: 5px;
      }
      .album-list-container::-webkit-scrollbar-thumb {
        border-radius: 3px;
        background-color: rgba(255, 255, 255, 0.3);
      }
      .album-list-container::-webkit-scrollbar-thumb:hover {
        background-color: rgba(255, 255, 255, 0.5);
      }
      .album-item {
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 16px;
        padding: 0;
        text-align: center;
        box-sizing: border-box;
        width: 100%;
        position: relative;
        overflow: hidden;
      }
      .album-item:hover {
        
        transform: translateY(-5px);
       
        
      }
      .album-cover {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        position: relative;
      }
      .album-cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.4s ease;
      }
      .album-item:hover .album-cover img {
        transform: scale(1.08);
      }
      .album-title {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.95);
        font-weight: 600;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        height: 36px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }
      @media (max-width: 768px) {
        .album-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 12px !important;
        }
        .album-list-title {
          font-size: 20px !important;
          margin: 15px 0 25px 0 !important;
        }
      }
      @media (max-width: 480px) {
        .album-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 10px !important;
        }
        .album-list-title {
          font-size: 18px !important;
          margin: 10px 0 20px 0 !important;
        }
        .album-list-footer {
          margin-top: 20px !important;
          padding: 15px 0 !important;
        }
        .album-list-warning {
          font-size: 12px !important;
          margin-bottom: 12px !important;
        }
        .album-list-classic-link {
          font-size: 12px !important;
          padding: 6px 16px !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // 创建专辑项 - 优化专辑项样式
    albums.forEach((album, index) => {
      const albumItem = document.createElement('div');
      albumItem.className = 'album-item';
      albumItem.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
        padding: 0;
        border-radius: 16px;
       
        text-align: center;
        box-sizing: border-box;
        width: 100%;
        position: relative;
        overflow: hidden;
      `;
      
      const albumCover = document.createElement('div');
      albumCover.className = 'album-cover';
      albumCover.innerHTML = `<img src="${encodeNonAscii(album.cover)}" alt="${album.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);">`;
      
      const albumTitle = document.createElement('div');
      albumTitle.className = 'album-title';
      albumTitle.textContent = album.name;
      albumTitle.style.cssText = `
        font-size: 13px;
        color: rgba(255, 255, 255, 0.95);
        font-weight: 600;
        line-height: 1.4;
        margin-top: 12px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        max-width: 100%;
        height: 36px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      `;
      
      albumItem.appendChild(albumCover);
      albumItem.appendChild(albumTitle);
      
      albumItem.addEventListener('click', function() {
        console.log(`Album clicked: ${album.name}`);
        
        // 更新当前专辑名称
        currentAlbumName = album.name;
        
        // 创建歌曲列表
        const songList = album.songs.map(song => ({
          name: song.title,
          artist: song.artist || album.artist || '未知艺术家', // 如果歌曲没有artist字段，则使用专辑级别的artist
          url: encodeNonAscii(song.url),
          cover: encodeNonAscii(song.cover || album.cover),
          lrc: encodeNonAscii(song.lrc),
          album: album.name // 添加专辑信息
        }));
        
        // 更新APlayer播放列表
        if (window.ap) {
          window.ap.list.clear();
          window.ap.list.add(songList);
          
          // 保持当前播放模式，但只使用当前专辑的歌曲
          if (typeof playMode !== 'undefined' && originalAudios && originalAudios.length > 0) {
            // 根据当前播放模式调整播放列表
            switch(playMode) {
              case 'list':
                // 顺序播放模式，只使用当前专辑的歌曲
                window.ap.list.audios = [...songList];
                break;
              case 'random':
                // 随机播放模式，只使用当前专辑的歌曲并随机排序
                window.ap.list.audios = [...songList];
                // Fisher-Yates shuffle算法
                for (let i = window.ap.list.audios.length - 1; i > 0; i--) {
                  const j = Math.floor(Math.random() * (i + 1));
                  [window.ap.list.audios[i], window.ap.list.audios[j]] = [window.ap.list.audios[j], window.ap.list.audios[i]];
                }
                break;
              case 'single':
                // 单曲循环模式，只使用当前专辑的歌曲
                window.ap.list.audios = [...songList];
                break;
              case 'loop':
                // 列表循环模式，只使用当前专辑的歌曲
                window.ap.list.audios = [...songList];
                break;
              default:
                // 默认情况，只使用当前专辑的歌曲
                window.ap.list.audios = [...songList];
            }
          }
          
          // 延迟一点时间再切换歌曲，确保覆盖函数已应用
          setTimeout(function() {
            // 自动播放第一首歌曲
            window.ap.list.switch(0);
            window.ap.play();
          }, 100);
          
          // 重新应用skipForward方法覆盖，确保切歌功能正常
          if (typeof overrideSkipForward === 'function') {
            overrideSkipForward();
          }
          
          // 重新应用skipBack方法覆盖，确保切歌功能正常
          if (typeof overrideSkipBack === 'function') {
            overrideSkipBack();
          }
          
          // 更新isLastSongInListMode状态
          if (typeof isLastSongInListMode !== 'undefined' && window.ap && window.ap.list && window.ap.list.audios) {
            if (typeof playMode !== 'undefined') {
              // 在专辑模式下，检查是否是当前专辑的最后一首歌
              const currentAlbumSongs = window.ap.list.audios.filter(song => song.album === currentAlbumName);
              const currentSongIndexInAlbum = currentAlbumSongs.findIndex(song => 
                song.name === window.ap.list.audios[window.ap.list.index].name && 
                song.artist === window.ap.list.audios[window.ap.list.index].artist
              );
              isLastSongInListMode = ((playMode === 'list' || playMode === 'single') && currentSongIndexInAlbum >= currentAlbumSongs.length - 1);
              console.log('专辑点击事件 - 更新isLastSongInListMode:', isLastSongInListMode, '当前播放模式:', playMode, '当前专辑:', currentAlbumName, '专辑内歌曲索引:', currentSongIndexInAlbum, '专辑总歌曲数:', currentAlbumSongs.length);
            }
          }
          
          // 关闭专辑列表
          hideAlbumList();
          
          // 根据窗口宽度处理歌曲列表显示状态
          if (window.innerWidth > 768) {
            // 在电脑端确保歌曲列表可见
            window.ap.list.show();
          } else {
            // 在移动端隐藏歌曲列表
            window.ap.list.hide();
          }
        }
      });
      
      albumGrid.appendChild(albumItem);
    });
    
    // 将专辑列表插入到body中，确保在DOM中正确显示
    document.body.appendChild(albumListContainer);
    
    // 确保专辑列表容器在DOM中正确显示
    console.log('Album list container created and inserted:', albumListContainer);
  }, 100); // 给APlayer一点时间初始化
}

// 在APlayer初始化完成后创建专辑列表
createAlbumList();

// 添加点击页面其他区域关闭歌曲列表的功能
document.addEventListener('click', function(event) {
  // 确保APlayer已初始化
  // 全局点击事件监听器已移除
});