import { i as isMobile, g as getDigFormat, u as uniqArray } from "./common.min.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
class FullPage {
  constructor(element, options) {
    let config = {
      //===============================
      // Селектор, на якому не працює подія свайпа/колеса
      noEventSelector: "[data-fls-fullpage-noevent]",
      //===============================
      // Налаштування оболонки
      // Клас при ініціалізації плагіна
      classInit: "--fullpage-init",
      // Клас для врапера під час гортання
      wrapperAnimatedClass: "--fullpage-switching",
      //===============================
      // Налаштування секцій
      // СЕЛЕКТОР для секцій
      selectorSection: "[data-fls-fullpage-section]",
      // Клас для активної секції
      activeClass: "--fullpage-active-section",
      // Клас для Попередньої секції
      previousClass: "--fullpage-previous-section",
      // Клас для наступної секції
      nextClass: "--fullpage-next-section",
      // id початково активного класу
      idActiveSection: 0,
      //===============================
      // Інші налаштування
      // Свайп мишею
      // touchSimulator: false,
      //===============================
      // Ефекти
      // Ефекти: fade, cards, slider
      mode: element.dataset.flsFullpageEffect ? element.dataset.flsFullpageEffect : "slider",
      //===============================
      // Булети
      // Активація буллетів
      bullets: element.hasAttribute("data-fls-fullpage-bullets") ? true : false,
      // Клас оболонки буллетів
      bulletsClass: "--fullpage-bullets",
      // Клас буллета
      bulletClass: "--fullpage-bullet",
      // Клас активного буллета
      bulletActiveClass: "--fullpage-bullet-active",
      //===============================
      // Події
      // Подія створення
      onInit: function() {
      },
      // Подія перегортання секції
      onSwitching: function() {
      },
      // Подія руйнування плагіна
      onDestroy: function() {
      }
    };
    this.options = Object.assign(config, options);
    this.wrapper = element;
    this.sections = this.wrapper.querySelectorAll(this.options.selectorSection);
    this.activeSection = false;
    this.activeSectionId = false;
    this.previousSection = false;
    this.previousSectionId = false;
    this.nextSection = false;
    this.nextSectionId = false;
    this.bulletsWrapper = false;
    this.stopEvent = false;
    if (this.sections.length) {
      this.init();
    }
  }
  //===============================
  // Початкова ініціалізація
  init() {
    if (this.options.idActiveSection > this.sections.length - 1) return;
    this.setId();
    this.activeSectionId = this.options.idActiveSection;
    this.setEffectsClasses();
    this.setClasses();
    this.setStyle();
    if (this.options.bullets) {
      this.setBullets();
      this.setActiveBullet(this.activeSectionId);
    }
    this.events();
    setTimeout(() => {
      document.documentElement.classList.add(this.options.classInit);
      this.options.onInit(this);
      document.dispatchEvent(new CustomEvent("fpinit", {
        detail: {
          fp: this
        }
      }));
    }, 0);
  }
  //===============================
  // Видалити
  destroy() {
    this.removeEvents();
    this.removeClasses();
    document.documentElement.classList.remove(this.options.classInit);
    this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
    this.removeEffectsClasses();
    this.removeZIndex();
    this.removeStyle();
    this.removeId();
    this.options.onDestroy(this);
    document.dispatchEvent(new CustomEvent("fpdestroy", {
      detail: {
        fp: this
      }
    }));
  }
  //===============================
  // Встановлення ID для секцій
  setId() {
    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      section.setAttribute("data-fls-fullpage-id", index);
    }
  }
  //===============================
  // Видалення ID для секцій
  removeId() {
    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      section.removeAttribute("data-fls-fullpage-id");
    }
  }
  //===============================
  // Функція встановлення класів для першої, активної та наступної секцій
  setClasses() {
    this.previousSectionId = this.activeSectionId - 1 >= 0 ? this.activeSectionId - 1 : false;
    this.nextSectionId = this.activeSectionId + 1 < this.sections.length ? this.activeSectionId + 1 : false;
    this.activeSection = this.sections[this.activeSectionId];
    this.activeSection.classList.add(this.options.activeClass);
    for (let index = 0; index < this.sections.length; index++) {
      document.documentElement.classList.remove(`--fullpage-section-${index}`);
    }
    document.documentElement.classList.add(`--fullpage-section-${this.activeSectionId}`);
    if (this.previousSectionId !== false) {
      this.previousSection = this.sections[this.previousSectionId];
      this.previousSection.classList.add(this.options.previousClass);
    } else {
      this.previousSection = false;
    }
    if (this.nextSectionId !== false) {
      this.nextSection = this.sections[this.nextSectionId];
      this.nextSection.classList.add(this.options.nextClass);
    } else {
      this.nextSection = false;
    }
  }
  //===============================
  // Присвоєння класів із різними ефектами
  removeEffectsClasses() {
    switch (this.options.mode) {
      case "slider":
        this.wrapper.classList.remove("slider-mode");
        break;
      case "cards":
        this.wrapper.classList.remove("cards-mode");
        this.setZIndex();
        break;
      case "fade":
        this.wrapper.classList.remove("fade-mode");
        this.setZIndex();
        break;
    }
  }
  //===============================
  // Присвоєння класів із різними ефектами
  setEffectsClasses() {
    switch (this.options.mode) {
      case "slider":
        this.wrapper.classList.add("slider-mode");
        break;
      case "cards":
        this.wrapper.classList.add("cards-mode");
        this.setZIndex();
        break;
      case "fade":
        this.wrapper.classList.add("fade-mode");
        this.setZIndex();
        break;
    }
  }
  //===============================
  // Блокування напрямків скролла
  //===============================
  // Функція встановлення стилів
  setStyle() {
    switch (this.options.mode) {
      case "slider":
        this.styleSlider();
        break;
      case "cards":
        this.styleCards();
        break;
      case "fade":
        this.styleFade();
        break;
    }
  }
  // slider-mode
  styleSlider() {
    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      if (index === this.activeSectionId) {
        section.style.transform = "translate3D(0,0,0)";
      } else if (index < this.activeSectionId) {
        section.style.transform = "translate3D(0,-100%,0)";
      } else if (index > this.activeSectionId) {
        section.style.transform = "translate3D(0,100%,0)";
      }
    }
  }
  // cards mode
  styleCards() {
    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      if (index >= this.activeSectionId) {
        section.style.transform = "translate3D(0,0,0)";
      } else if (index < this.activeSectionId) {
        section.style.transform = "translate3D(0,-100%,0)";
      }
    }
  }
  // fade style 
  styleFade() {
    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      if (index === this.activeSectionId) {
        section.style.opacity = "1";
        section.style.pointerEvents = "all";
      } else {
        section.style.opacity = "0";
        section.style.pointerEvents = "none";
      }
    }
  }
  //===============================
  // Видалення стилів
  removeStyle() {
    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      section.style.opacity = "";
      section.style.visibility = "";
      section.style.transform = "";
    }
  }
  //===============================
  // Функція перевірки чи повністю було прокручено елемент
  checkScroll(yCoord, element) {
    this.goScroll = false;
    if (!this.stopEvent && element) {
      this.goScroll = true;
      if (this.haveScroll(element)) {
        this.goScroll = false;
        const position = Math.round(element.scrollHeight - element.scrollTop);
        if (Math.abs(position - element.scrollHeight) < 2 && yCoord <= 0 || Math.abs(position - element.clientHeight) < 2 && yCoord >= 0) {
          this.goScroll = true;
        }
      }
    }
  }
  //===============================
  // Перевірка висоти 
  haveScroll(element) {
    return element.scrollHeight !== window.innerHeight;
  }
  //===============================
  // Видалення класів 
  removeClasses() {
    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      section.classList.remove(this.options.activeClass);
      section.classList.remove(this.options.previousClass);
      section.classList.remove(this.options.nextClass);
    }
  }
  //===============================
  // Збірник подій...
  events() {
    this.events = {
      // Колесо миші
      wheel: this.wheel.bind(this),
      // Свайп
      touchdown: this.touchDown.bind(this),
      touchup: this.touchUp.bind(this),
      touchmove: this.touchMove.bind(this),
      touchcancel: this.touchUp.bind(this),
      // Кінець анімації
      transitionEnd: this.transitionend.bind(this),
      // Клік для буллетів
      click: this.clickBullets.bind(this)
    };
    if (isMobile.iOS()) {
      document.addEventListener("touchmove", (e) => {
        e.preventDefault();
      });
    }
    this.setEvents();
  }
  setEvents() {
    this.wrapper.addEventListener("wheel", this.events.wheel);
    this.wrapper.addEventListener("touchstart", this.events.touchdown);
    if (this.options.bullets && this.bulletsWrapper) {
      this.bulletsWrapper.addEventListener("click", this.events.click);
    }
  }
  removeEvents() {
    this.wrapper.removeEventListener("wheel", this.events.wheel);
    this.wrapper.removeEventListener("touchdown", this.events.touchdown);
    this.wrapper.removeEventListener("touchup", this.events.touchup);
    this.wrapper.removeEventListener("touchcancel", this.events.touchup);
    this.wrapper.removeEventListener("touchmove", this.events.touchmove);
    if (this.bulletsWrapper) {
      this.bulletsWrapper.removeEventListener("click", this.events.click);
    }
  }
  //===============================
  // Функція кліка по булетах
  clickBullets(e) {
    const bullet = e.target.closest(`.${this.options.bulletClass}`);
    if (bullet) {
      const arrayChildren = Array.from(this.bulletsWrapper.children);
      const idClickBullet = arrayChildren.indexOf(bullet);
      this.switchingSection(idClickBullet);
    }
  }
  //===============================
  // Установка стилів для буллетів
  setActiveBullet(idButton) {
    if (!this.bulletsWrapper) return;
    const bullets = this.bulletsWrapper.children;
    for (let index = 0; index < bullets.length; index++) {
      const bullet = bullets[index];
      if (idButton === index) bullet.classList.add(this.options.bulletActiveClass);
      else bullet.classList.remove(this.options.bulletActiveClass);
    }
  }
  //===============================
  // Функція натискання тач/пера/курсора
  touchDown(e) {
    this._yP = e.changedTouches[0].pageY;
    this._eventElement = e.target.closest(`.${this.options.activeClass}`);
    if (this._eventElement) {
      this._eventElement.addEventListener("touchend", this.events.touchup);
      this._eventElement.addEventListener("touchcancel", this.events.touchup);
      this._eventElement.addEventListener("touchmove", this.events.touchmove);
      this.clickOrTouch = true;
      if (isMobile.iOS()) {
        if (this._eventElement.scrollHeight !== this._eventElement.clientHeight) {
          if (this._eventElement.scrollTop === 0) {
            this._eventElement.scrollTop = 1;
          }
          if (this._eventElement.scrollTop === this._eventElement.scrollHeight - this._eventElement.clientHeight) {
            this._eventElement.scrollTop = this._eventElement.scrollHeight - this._eventElement.clientHeight - 1;
          }
        }
        this.allowUp = this._eventElement.scrollTop > 0;
        this.allowDown = this._eventElement.scrollTop < this._eventElement.scrollHeight - this._eventElement.clientHeight;
        this.lastY = e.changedTouches[0].pageY;
      }
    }
  }
  //===============================
  // Подія руху тач/пера/курсора
  touchMove(e) {
    const targetElement = e.target.closest(`.${this.options.activeClass}`);
    if (isMobile.iOS()) {
      let up = e.changedTouches[0].pageY > this.lastY;
      let down = !up;
      this.lastY = e.changedTouches[0].pageY;
      if (targetElement) {
        if (up && this.allowUp || down && this.allowDown) {
          e.stopPropagation();
        } else if (e.cancelable) {
          e.preventDefault();
        }
      }
    }
    if (!this.clickOrTouch || e.target.closest(this.options.noEventSelector)) return;
    let yCoord = this._yP - e.changedTouches[0].pageY;
    this.checkScroll(yCoord, targetElement);
    if (this.goScroll && Math.abs(yCoord) > 20) {
      this.choiceOfDirection(yCoord);
    }
  }
  //===============================
  // Подія відпускання від екрану тач/пера/курсора
  touchUp(e) {
    this._eventElement.removeEventListener("touchend", this.events.touchup);
    this._eventElement.removeEventListener("touchcancel", this.events.touchup);
    this._eventElement.removeEventListener("touchmove", this.events.touchmove);
    return this.clickOrTouch = false;
  }
  //===============================
  // Кінець спрацьовування переходу
  transitionend(e) {
    this.stopEvent = false;
    document.documentElement.classList.remove(this.options.wrapperAnimatedClass);
    this.wrapper.classList.remove(this.options.wrapperAnimatedClass);
  }
  //===============================
  // Подія прокручування колесом миші
  wheel(e) {
    if (e.target.closest(this.options.noEventSelector)) return;
    const yCoord = e.deltaY;
    const targetElement = e.target.closest(`.${this.options.activeClass}`);
    this.checkScroll(yCoord, targetElement);
    if (this.goScroll) this.choiceOfDirection(yCoord);
  }
  //===============================
  // Функція вибору напряму
  choiceOfDirection(direction) {
    if (direction > 0 && this.nextSection !== false) {
      this.activeSectionId = this.activeSectionId + 1 < this.sections.length ? ++this.activeSectionId : this.activeSectionId;
    } else if (direction < 0 && this.previousSection !== false) {
      this.activeSectionId = this.activeSectionId - 1 >= 0 ? --this.activeSectionId : this.activeSectionId;
    }
    this.switchingSection(this.activeSectionId, direction);
  }
  //===============================
  // Функція перемикання слайдів
  switchingSection(idSection = this.activeSectionId, direction) {
    if (!direction) {
      if (idSection < this.activeSectionId) {
        direction = -100;
      } else if (idSection > this.activeSectionId) {
        direction = 100;
      }
    }
    this.activeSectionId = idSection;
    this.stopEvent = true;
    if (this.previousSectionId === false && direction < 0 || this.nextSectionId === false && direction > 0) {
      this.stopEvent = false;
    }
    if (this.stopEvent) {
      document.documentElement.classList.add(this.options.wrapperAnimatedClass);
      this.wrapper.classList.add(this.options.wrapperAnimatedClass);
      this.removeClasses();
      this.setClasses();
      this.setStyle();
      if (this.options.bullets) this.setActiveBullet(this.activeSectionId);
      let delaySection;
      if (direction < 0) {
        delaySection = this.activeSection.dataset.flsFullpageDirectionUp ? parseInt(this.activeSection.dataset.flsFullpageDirectionUp) : 500;
        document.documentElement.classList.add("--fullpage-up");
        document.documentElement.classList.remove("--fullpage-down");
      } else {
        delaySection = this.activeSection.dataset.flsFullpageDirectionDown ? parseInt(this.activeSection.dataset.flsFullpageDirectionDown) : 500;
        document.documentElement.classList.remove("--fullpage-up");
        document.documentElement.classList.add("--fullpage-down");
      }
      setTimeout(() => {
        this.events.transitionEnd();
      }, delaySection);
      this.options.onSwitching(this);
      document.dispatchEvent(new CustomEvent("fpswitching", {
        detail: {
          fp: this
        }
      }));
    }
  }
  //===============================
  // Встановлення булетів
  setBullets() {
    this.bulletsWrapper = document.querySelector(`.${this.options.bulletsClass}`);
    if (!this.bulletsWrapper) {
      const bullets = document.createElement("div");
      bullets.classList.add(this.options.bulletsClass);
      this.wrapper.append(bullets);
      this.bulletsWrapper = bullets;
    }
    if (this.bulletsWrapper) {
      for (let index = 0; index < this.sections.length; index++) {
        const span = document.createElement("span");
        span.classList.add(this.options.bulletClass);
        this.bulletsWrapper.append(span);
      }
    }
  }
  //===============================
  // Z-INDEX
  setZIndex() {
    let zIndex = this.sections.length;
    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      section.style.zIndex = zIndex;
      --zIndex;
    }
  }
  removeZIndex() {
    for (let index = 0; index < this.sections.length; index++) {
      const section = this.sections[index];
      section.style.zIndex = "";
    }
  }
}
if (document.querySelector("[data-fls-fullpage]")) {
  window.addEventListener("load", () => window.flsFullpage = new FullPage(document.querySelector("[data-fls-fullpage]")));
}
function digitsCounter() {
  function digitsCountersInit(digitsCountersItems) {
    let digitsCounters = digitsCountersItems ? digitsCountersItems : document.querySelectorAll("[data-fls-digcounter]");
    if (digitsCounters.length) {
      digitsCounters.forEach((digitsCounter2) => {
        if (digitsCounter2.hasAttribute("data-fls-digcounter-go")) return;
        digitsCounter2.setAttribute("data-fls-digcounter-go", "");
        digitsCounter2.dataset.flsDigcounter = digitsCounter2.innerHTML;
        digitsCounter2.innerHTML = `0`;
        digitsCountersAnimate(digitsCounter2);
      });
    }
  }
  function digitsCountersAnimate(digitsCounter2) {
    let startTimestamp = null;
    const duration = parseFloat(digitsCounter2.dataset.flsDigcounterSpeed) ? parseFloat(digitsCounter2.dataset.flsDigcounterSpeed) : 1e3;
    const startValue = parseFloat(digitsCounter2.dataset.flsDigcounter);
    const format = digitsCounter2.dataset.flsDigcounterFormat ? digitsCounter2.dataset.flsDigcounterFormat : " ";
    const startPosition = 0;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (startPosition + startValue));
      digitsCounter2.innerHTML = typeof digitsCounter2.dataset.flsDigcounterFormat !== "undefined" ? getDigFormat(value, format) : value;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        digitsCounter2.removeAttribute("data-fls-digcounter-go");
      }
    };
    window.requestAnimationFrame(step);
  }
  function digitsCounterAction(e) {
    const entry = e.detail.entry;
    const targetElement = entry.target;
    if (targetElement.querySelectorAll("[data-fls-digcounter]").length && !targetElement.querySelectorAll("[data-fls-watcher]").length && entry.isIntersecting) {
      digitsCountersInit(targetElement.querySelectorAll("[data-fls-digcounter]"));
    }
  }
  document.addEventListener("watcherCallback", digitsCounterAction);
}
document.querySelector("[data-fls-digcounter]") ? window.addEventListener("load", digitsCounter) : null;
class ScrollWatcher {
  constructor(props) {
    let defaultConfig = {
      logging: true
    };
    this.config = Object.assign(defaultConfig, props);
    this.observer;
    !document.documentElement.hasAttribute("data-fls-watch") ? this.scrollWatcherRun() : null;
  }
  // Оновлюємо конструктор
  scrollWatcherUpdate() {
    this.scrollWatcherRun();
  }
  // Запускаємо конструктор
  scrollWatcherRun() {
    document.documentElement.setAttribute("data-fls-watch", "");
    this.scrollWatcherConstructor(document.querySelectorAll("[data-fls-watcher]"));
  }
  // Конструктор спостерігачів
  scrollWatcherConstructor(items) {
    if (items.length) {
      let uniqParams = uniqArray(Array.from(items).map(function(item) {
        if (item.dataset.flsWatcher === "navigator" && !item.dataset.flsWatcherThreshold) {
          let valueOfThreshold;
          if (item.clientHeight > 2) {
            valueOfThreshold = window.innerHeight / 2 / (item.clientHeight - 1);
            if (valueOfThreshold > 1) {
              valueOfThreshold = 1;
            }
          } else {
            valueOfThreshold = 1;
          }
          item.setAttribute(
            "data-fls-watcher-threshold",
            valueOfThreshold.toFixed(2)
          );
        }
        return `${item.dataset.flsWatcherRoot ? item.dataset.flsWatcherRoot : null}|${item.dataset.flsWatcherMargin ? item.dataset.flsWatcherMargin : "0px"}|${item.dataset.flsWatcherThreshold ? item.dataset.flsWatcherThreshold : 0}`;
      }));
      uniqParams.forEach((uniqParam) => {
        let uniqParamArray = uniqParam.split("|");
        let paramsWatch = {
          root: uniqParamArray[0],
          margin: uniqParamArray[1],
          threshold: uniqParamArray[2]
        };
        let groupItems = Array.from(items).filter(function(item) {
          let watchRoot = item.dataset.flsWatcherRoot ? item.dataset.flsWatcherRoot : null;
          let watchMargin = item.dataset.flsWatcherMargin ? item.dataset.flsWatcherMargin : "0px";
          let watchThreshold = item.dataset.flsWatcherThreshold ? item.dataset.flsWatcherThreshold : 0;
          if (String(watchRoot) === paramsWatch.root && String(watchMargin) === paramsWatch.margin && String(watchThreshold) === paramsWatch.threshold) {
            return item;
          }
        });
        let configWatcher = this.getScrollWatcherConfig(paramsWatch);
        this.scrollWatcherInit(groupItems, configWatcher);
      });
    }
  }
  // Функція створення налаштувань
  getScrollWatcherConfig(paramsWatch) {
    let configWatcher = {};
    if (document.querySelector(paramsWatch.root)) {
      configWatcher.root = document.querySelector(paramsWatch.root);
    } else if (paramsWatch.root !== "null") ;
    configWatcher.rootMargin = paramsWatch.margin;
    if (paramsWatch.margin.indexOf("px") < 0 && paramsWatch.margin.indexOf("%") < 0) {
      return;
    }
    if (paramsWatch.threshold === "prx") {
      paramsWatch.threshold = [];
      for (let i = 0; i <= 1; i += 5e-3) {
        paramsWatch.threshold.push(i);
      }
    } else {
      paramsWatch.threshold = paramsWatch.threshold.split(",");
    }
    configWatcher.threshold = paramsWatch.threshold;
    return configWatcher;
  }
  // Функція створення нового спостерігача зі своїми налаштуваннями
  scrollWatcherCreate(configWatcher) {
    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        this.scrollWatcherCallback(entry, observer);
      });
    }, configWatcher);
  }
  // Функція ініціалізації спостерігача зі своїми налаштуваннями
  scrollWatcherInit(items, configWatcher) {
    this.scrollWatcherCreate(configWatcher);
    items.forEach((item) => this.observer.observe(item));
  }
  // Функція обробки базових дій точок спрацьовування
  scrollWatcherIntersecting(entry, targetElement) {
    if (entry.isIntersecting) {
      !targetElement.classList.contains("--watcher-view") ? targetElement.classList.add("--watcher-view") : null;
    } else {
      targetElement.classList.contains("--watcher-view") ? targetElement.classList.remove("--watcher-view") : null;
    }
  }
  // Функція відключення стеження за об'єктом
  scrollWatcherOff(targetElement, observer) {
    observer.unobserve(targetElement);
  }
  // Функція обробки спостереження
  scrollWatcherCallback(entry, observer) {
    const targetElement = entry.target;
    this.scrollWatcherIntersecting(entry, targetElement);
    targetElement.hasAttribute("data-fls-watcher-once") && entry.isIntersecting ? this.scrollWatcherOff(targetElement, observer) : null;
    document.dispatchEvent(new CustomEvent("watcherCallback", {
      detail: {
        entry
      }
    }));
  }
}
document.querySelector("[data-fls-watcher]") ? window.addEventListener("load", () => new ScrollWatcher({})) : null;
class Parallax {
  constructor(elements) {
    if (elements.length) {
      this.elements = Array.from(elements).map((el) => new Parallax.Each(el, this.options));
    }
  }
  destroyEvents() {
    this.elements.forEach((el) => {
      el.destroyEvents();
    });
  }
  setEvents() {
    this.elements.forEach((el) => {
      el.setEvents();
    });
  }
}
Parallax.Each = class {
  constructor(parent) {
    this.parent = parent;
    this.elements = this.parent.querySelectorAll("[data-fls-parallax]");
    this.animation = this.animationFrame.bind(this);
    this.offset = 0;
    this.value = 0;
    this.smooth = parent.dataset.flsParallaxSmooth ? Number(parent.dataset.flsParallaxSmooth) : 15;
    this.setEvents();
  }
  setEvents() {
    this.animationID = window.requestAnimationFrame(this.animation);
  }
  destroyEvents() {
    window.cancelAnimationFrame(this.animationID);
  }
  animationFrame() {
    const topToWindow = this.parent.getBoundingClientRect().top;
    const heightParent = this.parent.offsetHeight;
    const heightWindow = window.innerHeight;
    const positionParent = {
      top: topToWindow - heightWindow,
      bottom: topToWindow + heightParent
    };
    const centerPoint = this.parent.dataset.flsParallaxCenter ? this.parent.dataset.flsParallaxCenter : "center";
    if (positionParent.top < 30 && positionParent.bottom > -30) {
      switch (centerPoint) {
        // верхній точці (початок батька стикається верхнього краю екрану)
        case "top":
          this.offset = -1 * topToWindow;
          break;
        // центрі екрана (середина батька у середині екрана)
        case "center":
          this.offset = heightWindow / 2 - (topToWindow + heightParent / 2);
          break;
        // Початок: нижня частина екрана = верхня частина батька
        case "bottom":
          this.offset = heightWindow - (topToWindow + heightParent);
          break;
      }
    }
    this.value += (this.offset - this.value) / this.smooth;
    this.animationID = window.requestAnimationFrame(this.animation);
    this.elements.forEach((el) => {
      const parameters = {
        axis: el.dataset.axis ? el.dataset.axis : "v",
        direction: el.dataset.flsParallaxDirection ? el.dataset.flsParallaxDirection + "1" : "-1",
        coefficient: el.dataset.flsParallaxCoefficient ? Number(el.dataset.flsParallaxCoefficient) : 5,
        additionalProperties: el.dataset.flsParallaxProperties ? el.dataset.flsParallaxProperties : ""
      };
      this.parameters(el, parameters);
    });
  }
  parameters(el, parameters) {
    if (parameters.axis == "v") {
      el.style.transform = `translate3D(0, ${(parameters.direction * (this.value / parameters.coefficient)).toFixed(2)}px,0) ${parameters.additionalProperties}`;
    } else if (parameters.axis == "h") {
      el.style.transform = `translate3D(${(parameters.direction * (this.value / parameters.coefficient)).toFixed(2)}px,0,0) ${parameters.additionalProperties}`;
    }
  }
};
if (document.querySelector("[data-fls-parallax-parent]")) {
  new Parallax(document.querySelectorAll("[data-fls-parallax-parent]"));
}
