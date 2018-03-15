/* -----------------------------------------------
/* Author : jiangbaojun
/* Demo
/* GitHub : https://github.com/jiangbaojun/mrk-editTable.git
/* How to use? : Check the GitHub README
/* v1.0
/* ----------------------------------------------- */


/**
 * 编辑表格控件VST-editTable
 * @param options 初始化参数
 * @author jiangbaojun
 * @version V1.1
 */
(function ($) {
    //声明编辑器、全局配置等
    var active,
        element,
        activeOptions,
        editor=$("<input style='display: none'>"),
        editorDate=$("<div style='display: none'>"),
        tempTimestamp=0;

    //定义键盘快捷键
    var ARROW_LEFT = 37, ARROW_UP = 38, ARROW_RIGHT = 39, ARROW_DOWN = 40, ENTER = 13, ESC = 27, TAB = 9;
    //定义类型
    var EtType={"TEXT": "text", "DATE":"date"};

    /**
     * 初始化VST-editTable控件
     * @param target    目标table
     * @param options   初始化配置选项，用于替换控件默认配置选项
     * @param params    暴露方法参数
     */
    function init(target, options, params){
        //不可自定义默认配置
        $.fn.vstEditTable.defaultOptions.cloneProperties = ['padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
            'text-align', 'font', 'font-size', 'font-family', 'font-weight'];
        $.fn.vstEditTable.defaultOptions.editor = $('<input id="etTextEditor" class="et-editor text">');
        $.fn.vstEditTable.defaultOptions.editorDate = $('<div id="etDatePicker" class="et-editor date">');
        $.fn.vstEditTable.defaultOptions.supportType=[EtType.TEXT, EtType.DATE];
        //扩展自定义配置
        activeOptions = $.extend(true, buildDefaultOptions(), options);

        element = $(target);
        //初始化文本编辑器
        editor = activeOptions.editor.css('position', 'absolute').hide().appendTo(element.parent());
        //处理依赖文件
        autoQuoteFile(function(){
            //初始化日期编辑器
            initDateEditor();
        });
        textEditorEvent();
        elementEvent();
        windowEvent();
    }

    /**
     * 获得控件默认配置选项
     */
    var buildDefaultOptions = function () {
        var opts = $.extend({}, $.fn.vstEditTable.defaultOptions);
        opts.editor = opts.editor.clone();
        opts.editorDate = opts.editorDate.clone();
        return opts;
    }

    function initDateEditor(){
        //初始化日期编辑器(此处这样设置样式，主要为了解决ie兼容问题，editorDate默认hide时，IE首次不能弹出)
        editorDate = activeOptions.editorDate.css({'position': 'absolute', 'top':'-9999px', 'left':'-9999px'}).appendTo(element.parent());
        try {
            if (typeof(WdatePicker) == "undefined") {
                console.log("WdatePicker unavailable!");
                editorDate.data("useable",false);
            } else {
                var dataOptions = $.extend(true, {}, activeOptions.dataOptions);
                dataOptions.eCont = 'etDatePicker';
                dataOptions.onpicked = function(dp){setActiveDate(dp);};
                WdatePicker(dataOptions);
                editorDate.data("useable",true);
            }
        } catch(e) {}
    }
    /**
     * 显示编辑器
     * @param type      编辑器类型
     * @param select    是否选中内容
     */
    function showEditor(type, select) {
        if (active!=null && active!=undefined && active.length) {
            //如果没有声明类型，根据当前单元格和配置获得类型
            if(type==null || type==undefined || type==""){
                type=getEditType(active);
            }
            //先隐藏所有编辑器
            $(".et-editor").hide();
            if(type == EtType.DATE && editorDate.data("useable")){
                // 日期编辑
                activeOffset=active.offset();
                editorDate.show()
                    .offset({top:activeOffset.top + active.height(), left:activeOffset.left})
                    .focus();
            }else{
                //默认使用text编辑
                editor.val(active.text())
                    .show()
                    .offset(active.offset())
                    .css(active.css(activeOptions.cloneProperties))
                    .width(active.width())
                    .height(active.height())
                    .focus();
            }
            if (select) {
                editor.select();
            }
            activeOptions.onStartEdit.call(this, active);
        }
    }

    /**
     * 获得单元格的编辑类型
     * @param ele 单元格
     * @return string 编辑类型
     */
    function getEditType(ele){
        var type = EtType.TEXT;
        //优先单元格指定类型
        var tdType = ele.attr(activeOptions.typeTd);
        if(isSupportType(tdType)){
            return tdType;
        }
        //其次行指定类型
        var trType = ele.parent("tr").attr(activeOptions.typeTr);
        if(isSupportType(trType)){
            return trType;
        }
        //最后按照配置项获取类型，但必须是标准单元格数据，不包含rowspan、colspan
        if(activeOptions.typeSerial!=undefined && activeOptions.typeSerial!=null && activeOptions.typeSerial!=[] && activeOptions.typeSerial.length>0){
            var index = ele.index();
            var typeSerial = activeOptions.typeSerial;
            if(index < typeSerial.length){
                if(isSupportType(typeSerial[index])){
                    type = typeSerial[index];
                }
            }
        }
        return type;
    }

    /**
     * 判断控件是否支持给定类型
     * @param type 给定类型
     * @return boolean 是否支持
     */
    function isSupportType(type){
        if(type!=undefined && type!=null){
            for(var key in EtType){
                if(type == EtType[key]){
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 选择完日期后的操作，设置日期编辑器内容到td
     * @param dp datePicker对象，包含选择的日期信息
     */
    function setActiveDate(dp){
        var dataStr = dp.cal.getDateStr();
        var originalContent = active.html();
        active.text(dataStr);
        if(dataStr!=null && dataStr!=originalContent){
            activeOptions.onChanged.call(this, originalContent, dataStr);
        }
        editorDate.hide();
        active.focus();
        activeOptions.onEndEdit.call(this, active);
    }

    /**
     *  设置文本编辑器的内容到td
     */
    function setActiveText() {
        var text = editor.val();
        var originalContent = active.html();
        active.text(text);
        if(text!=null && text!=originalContent){
            activeOptions.onChanged.call(this, originalContent, text);
        }
    }

    /**
     * 通过键盘快捷键获得选中（焦点）TD
     * @param element   当前选中（焦点）TD
     * @param keycode   键盘值
     * @returns {*}     返回本次选中（焦点）TD
     */
    function movement(element, keycode) {
        if (keycode === ARROW_RIGHT) {
            return element.next('td');
        } else if (keycode === ARROW_LEFT) {
            return element.prev('td');
        } else if (keycode === ARROW_UP) {
            return element.parent().prev().children().eq(element.index());
        } else if (keycode === ARROW_DOWN) {
            return element.parent().next().children().eq(element.index());
        }
        return [];
    }

    /**
     * 文本编辑器事件处理
     */
    function textEditorEvent(){
        editor.blur(function () {
            setActiveText();
            editor.hide();
            active.focus();
            endEdit();
        }).keydown(function (e) {
            if (e.which === ENTER) {
                setActiveText();
                editor.hide();
                active.focus();
                endEdit();
                e.preventDefault();
                e.stopPropagation();
            } else if (e.which === ESC) {
                editor.val(active.text());
                e.preventDefault();
                e.stopPropagation();
                editor.hide();
                active.focus();
                activeOptions.onCancelEdit.call(this, active);
            } else if (e.which === TAB) {
                active.focus();
            } else if (this.selectionEnd - this.selectionStart === this.value.length) {
                var possibleMove = movement(active, e.which);
                if (possibleMove.length > 0) {
                    possibleMove.focus();
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        })
    }

    /**
     * 结束编辑，时间戳主要解决editor的blur和keydown同时触发问题
     */
    function endEdit(){
        if(new Date().getTime() - tempTimestamp > 200){
            activeOptions.onEndEdit.call(this, active);
        }
        tempTimestamp = new Date().getTime();
    }

    /**
     * 设置当前焦点TD（即切换选中（焦点）的TD）
     */
    function setActiver(){
        if(active!=null && active!=undefined){
            element.find("td").removeClass("et-active");
        }
        active = element.find('td:focus').addClass("et-active");
        editorDate.hide();
    }

    /**
     * 目标table事件处理
     */
    function elementEvent(){
        element.css('cursor', 'pointer')
            .on('click dblclick', setActiver)
            .on('keypress dblclick', function(){showEditor(null, false);})
            .keydown(function (e) {
                var directEdit = activeOptions.directEdit,
                    possibleMove = movement($(e.target), e.which);
                if (possibleMove.length > 0) {
                    possibleMove.focus();
                    setActiver();
                } else if (e.which === ENTER) {
                    showEditor(null, false);
                } else if (e.which === ESC) {
                    if(editor.is(":visible")){
                        editor.hide();
                    }
                }else if (e.which === 17) {
                    //此处判断哪些按键开启编辑模式，并且是选中内容
                    directEdit = true;
                    showEditor(null, true);
                }
                if (!directEdit) {
                    e.stopPropagation();
                    e.preventDefault();
                }
            });
        element.find('td').prop('tabindex', 1);
    }

    /**
     * 处理窗口缩放，保证编辑器位置准确
     */
    function windowEvent(){
        $(window).on('resize', function () {
            if (editor!=undefined && editor.is(':visible')) {
                editor.offset(active.offset())
                    .width(active.width())
                    .height(active.height());
            }
            if (editorDate!=undefined && active!=undefined && editorDate.is(':visible')) {
                editor.offset(active.offset());
            }
        });
    }

    /**
     * 处理依赖文件
     */
    function autoQuoteFile(callback){
        var dynamicLoading = {
            css: function(path) {
                if (!path || path.length === 0) {
                    throw new Error('argument "path" is required !');
                };
                var head = document.getElementsByTagName('head')[0];
                var link = document.createElement('link');
                link.href = path;
                link.rel = 'stylesheet';
                link.type = 'text/css';
                head.appendChild(link);
            },
            js: function(path, innerCallback) {
                if (!path || path.length === 0) {
                    throw new Error('argument "path" is required !');
                };
                var head = document.getElementsByTagName('head')[0];
                var script = document.createElement('script');
                script.src = path;
                script.type = 'text/javascript';
                //添加加载完成事件，做回调。解决文件依赖，异步加载问题。
                var flag=false;
                //ie
                script.onreadystatechange = function(){
                    var r = script.readyState;
                    if (r === 'loaded' || r === 'complete') {
                        script.onreadystatechange = null;
                        if(!flag){
                            innerCallback();
                            flag=true;
                        }
                    }
                };
                //not ie
                script.onload = function(){
                    console.log("onreadystatechange");
                    if(!flag){
                        innerCallback();
                        flag=true;
                    }
                };
                head.appendChild(script);
            }
        };
        $("script").each(function() {
            var src = $(this).attr("src");
            if (src!=undefined && src.indexOf(activeOptions.scriptName) != -1) {
                //处理日期控件datePicker依赖
                var datePickerPath=src.substring(0, src.indexOf(activeOptions.scriptName)) + "My97DatePicker/WdatePicker.js";
                if(activeOptions.autoQuoteDatePicker) {
                    if(activeOptions.datePickerPath!=null){
                        datePickerPath=activeOptions.datePickerPath;
                    }
                    dynamicLoading.js(datePickerPath, function(){
                        callback();
                    });
                }
                //引入css依赖文件
                dynamicLoading.css(src.substring(0, src.indexOf(activeOptions.scriptName)) + activeOptions.styleName + ".css");
                return false;
            }
        });
    }
    /**
     * jQuery扩展控件方法
     * @param options   自定义配置选项
     * @param params    暴露方法参数
     */
	$.fn.vstEditTable = function (options, params) {
		//该控件只针对table标签扩展
		if(!this.is('table')){
			return;
		}
        //扩展方法
        if (typeof options == "string") {
            var method = $.fn.vstEditTable.methods[options];
            if (method) return method(this, params);
        }
        //初始化控件
        init(this, options, params);
	};

    /**
     * 控件暴露方法
     */
    $.fn.vstEditTable.methods = {
        /**
         * 开启编辑器，进入编辑模式
         * @param target    table对象
         * @param type      编辑类型，目前支持text、date。默认text
         */
    	"edit": function(target, type){
            showEditor(type, false);
		}
	};

    /**
     * 控件默认配置选项
     */
	$.fn.vstEditTable.defaultOptions = {
        autoQuoteDatePicker: true,
        datePickerPath: null,
        scriptName: "vst-editTable",
        styleName: "vst-editTable",
        typeSerial: [],
        typeTd: "et-typetd",
        typeTr: "et-typetr",
		directEdit: false,
        onStartEdit: function(target){},
        onCancelEdit: function(target){},
        onChanged: function(oldValue, newValue){},
        onEndEdit: function(target){}
	};

})(jQuery);
