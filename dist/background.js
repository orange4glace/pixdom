/******/ (() => { // webpackBootstrap
/*!*****************************!*\
  !*** ./background/index.ts ***!
  \*****************************/
chrome.browserAction.onClicked.addListener(function (tab) {
    chrome.tabs.executeScript({
        file: 'contentScript.js'
    });
});

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9waXhkb20vLi9iYWNrZ3JvdW5kL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSxNQUFNLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsVUFBUyxHQUFHO0lBQ3JELE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDO1FBQ3hCLElBQUksRUFBRSxrQkFBa0I7S0FDekIsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNocm9tZS5icm93c2VyQWN0aW9uLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcihmdW5jdGlvbih0YWIpIHtcclxuICBjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0KHtcclxuICAgIGZpbGU6ICdjb250ZW50U2NyaXB0LmpzJ1xyXG4gIH0pO1xyXG59KTsiXSwic291cmNlUm9vdCI6IiJ9