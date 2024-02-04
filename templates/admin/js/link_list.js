layui.use(['form','table','dropdown','miniTab'], function () {
    var $ = layui.jquery;
    var table = layui.table;
    var form = layui.form;
    var dropdown = layui.dropdown;
    var miniTab = layui.miniTab;
    var categorys = [];
    var IDs = [];
    var api = get_api('read_link_list'); //列表接口
    var limit = localStorage.getItem(u + "_limit") || 50; //尝试读取本地记忆数据,没有就默认50
    var link_sort = JSON.parse(localStorage.getItem(u + "_link_sort")) || {field: 'lid', type: null };
    var pwds = [];
    miniTab.listen();
    //渲染表格
    renderTable1();
    function renderTable1(){
        //先获取分类数据(用于显示所属分类和筛选)
        $.post(get_api('read_category_list','Simplify'),function(data,status){
            if(data.code != 1){
                layer.alert("获取分类数据失败,请刷新重试",{icon:5,title:'错误',anim: 2,closeBtn: 0,btn: ['刷新页面']},function () {location.reload();});
                return;
            }else{
                categorys = data.data;//赋值分类数据
                renderTable2();//开始渲染表格
            }
        });
    }
    var img_src;
    var cols=[ //表头
      {type:'checkbox'} //开启复选框
      ,{field: 'lid', title: 'ID', width:80, sort: true,hide:true}
      ,{field: 'fid', title: '所属分类',sort:true,width:140,event: 'edit_category',templet:function(d){
          //检查是否存在,避免特殊情况报错
          if (categorys && categorys[d.fid] && categorys[d.fid].font_icon && categorys[d.fid].name) { 
              return  '<i class="' + categorys[d.fid].font_icon + '"></i> ' + categorys[d.fid].name;
          }else{
              return 'Null';
          }
      }}
      ,{field: 'icon', title: '图标', width:60, templet:function(d){
          if(d.icon == null || d.icon == ""){
              return '<img src="./templates/admin/img/ie.svg" width="28" height="28">';
          }else{
              if(d.icon.substr(0,5) =='data:') {
                img_src = d.icon;
              }else if(d.icon.substr(0,4) == '<svg'){
                img_src = 'data:image/svg+xml;base64,'+ btoa(d.icon.replace(/[\u00A0-\u2666]/g, function(c) {return '&#' + c.charCodeAt(0) + ';';}));
              }else{
                img_src = d.icon + (d.icon.indexOf('?') !== -1 ? '&_t=' : '?_t=')  + Date.now();
              }
              return '<img src="' + img_src + '" width="28" height="28">';
          }
      }}
      ,{field: 'title', title: '链接标题',sort:true, width:200, edit: 'text'}
      ,{ title:'操作', toolbar: '#tablebar',width:110}
      ,{field:'pwd_id',title:'密码',width:70,templet: function(d){
          return d.pwd_id>0?'<a class="layui-btn layui-btn-normal layui-btn-xs" lay-event="pwd">查看</a>':'';
      }}
      ,{field: 'property', title: '私有', width: 100, sort: true,templet: function(d){
          return "<input type='checkbox' value='" + d.lid + "' lay-filter='property' lay-skin='switch' lay-text='私有|公开' " + (d.property == 1?"checked":"" )+  ">";
      }}
      ,{field: 'status', title: '状态', width: 100, sort: true,templet: function(d){
          return "<input type='checkbox' value='" + d.lid + "' lay-filter='status' lay-skin='switch' lay-text='启用|禁用' " + (d.status == 1?"checked":"" )+  ">";
      }}
      ,{field: 'url',sort:true, title: 'URL',templet:function(d){
          return '<a color=""   target = "_blank" href = "' + d.url + '" title = "' + d.url + '" referrerpolicy="same-origin" >' + d.url + '</a>';
      }}
      ,{field: 'click', title: '点击数',width:90,sort:true}
      ,{field: 'add_time', title: '添加时间', width:160, sort: true,templet:function(d){
          var add_time = timestampToTime(d.add_time);
          return add_time;
      }}
      ,{field: 'up_time', title: '修改时间', width:160,sort:true,templet:function(d){
          return d.up_time == null ?'':timestampToTime(d.up_time);
      }}
    ];
    //读取列筛选
    var local = layui.data('table-filter-link-list'); 
    layui.each(cols, function(index, item){
        if(item.field in local){
            item.hide = local[item.field];
        }
    });
    
    //渲染表格函数
    var renderTable2 = function () {
        where = link_sort.type === null ? {} : {field:link_sort.field,order:link_sort.type.toUpperCase()};
        table.render({
            elem: '#table'
            ,height: 'full-110' //自适应高度
            ,url: api //数据接口
            ,where: where
            ,page: true //开启分页
            ,limit:limit  //默认每页显示行数
            ,limits: [20,50,100,300,500]
            ,even:true //隔行背景色
            ,loading:true //加载条
            ,toolbar: '#toolbar'
            ,id:'table'
            ,initSort: link_sort
            ,cols: [cols]
            ,method: 'post'
            ,response: {statusCode: 1 } 
            ,done: function (res, curr, count) {
                load_dropdown();//加载移动端菜单
                //获取当前每页显示数量.并写入本都储存
                var temp_limit = $(".layui-laypage-limits option:selected").val();
                if(temp_limit > 0 && localStorage.getItem(u + "_limit") != temp_limit){
                    localStorage.setItem(u + "_limit",temp_limit);
                }
                $("[data-field='lid']").addClass('layui-hide-xs');
                $("[data-field='url']").addClass('layui-hide-xs');
                $("[data-field='category_name']").addClass('layui-hide-xs');
                $("[data-field='add_time']").addClass('layui-hide-xs');
                $("[data-field='up_time']").addClass('layui-hide-xs');
                $("[data-field='click']").addClass('layui-hide-xs');
                // $(".layui-laypage .layui-laypage-prev").addClass('layui-hide-xs');
                // $(".layui-laypage .layui-laypage-curr").addClass('layui-hide-xs');
                // $(".layui-laypage .layui-laypage-next").addClass('layui-hide-xs');
                $(".layui-laypage .layui-laypage-skip").addClass('layui-hide-xs');
                $(".layui-table-tool-self").addClass('layui-hide-xs');
                //加载加密分组数据
                $.post(get_api('read_pwd_group_list'),{'page':'1','limit':'9999'},function(data,status){
                    if(data.code == 1){
                        pwds = [];
                        for(var i =0;i<data.count;i++){
                            pwds['pid_'+data.data[i].pid] = {'pwd':data.data[i].password,'name':data.data[i].name};
                        }
                    }
                });
                //记忆列筛选
                var that = this;
                that.elem.next().on('mousedown', 'input[lay-filter="LAY_TABLE_TOOL_COLS"]+', function(){
                    var input = $(this).prev()[0];
                    layui.data('table-filter-link-list', {
                        key: input.name,value: input.checked
                    });
                });
                $('th[data-field="icon"]').attr('title', '仅显示已上传的图标');
            }
        });
        // 监听表格排序事件
        table.on('sort(table)', function(obj) {
            link_sort = {field:obj.field,type:obj.type};
            localStorage.setItem(u + "_link_sort",JSON.stringify(link_sort));
            link_search();
        });
    };
    
    function link_search(){
        let data = form.val('form');
        if(link_sort.type != null){
            data.field = link_sort.field;
            data.order = link_sort.type.toUpperCase();
        }
        table.reload('table', {
            url: api
            ,method: 'post'
            ,request: {pageName: 'page',limitName: 'limit'}
            ,where: data
            ,page: {curr: 1}
        });
    }
    
    //关键字回车搜索
    $('#link_keyword').keydown(function (e){if(e.keyCode === 13){link_search();}}); 
    //搜索按钮点击
    $('#link_search').on('click', function(){link_search();});

    //监听工具栏
    table.on('toolbar(table)', function (obj) {
        var event = obj.event;
        if (event == 'add_link') {
            layer.open({
                    title: '添加链接',
                    type: 2,
                    scrollbar: false,
                    shade: 0.2,
                    maxmin:false,
                    shadeClose: true,
                    area: ['100%', '100%'],
                    content: './index.php?c=admin&page=link_add&source=link_list&u=' + u +"&fid=" + $('#fid').val(),
                });
            //做一个关闭时检查是否需要刷新数据?
            return;
        }
        
        var checkStatus = table.checkStatus(obj.config.id);
        if( checkStatus.data.length == 0 && ['LAYTABLE_COLS','LAYTABLE_EXPORT','LAYTABLE_PRINT','batch','link_extend'].indexOf(event) == -1 ) {
            layer.msg('未选中任何数据！');
            return;
        }
        //取被选中的链接ID
        tableIds = checkStatus.data.map(function (value) {return value.lid;});
        tableIds = JSON.stringify(tableIds);
        
        //通用型批量操作
        if(['batch_del','batch_private','batch_public','batch_start','batch_disable'].indexOf(event) != -1){
            if(event == 'batch_del'){
                layer.confirm('确认删除?',{icon: 3, title:'温馨提示'}, function(index){
                    batch_operation(tableIds,event);
                });
            }else{
                batch_operation(tableIds,event);
            }
        }else if(event === 'batch_category'){
            IDs = tableIds;
            index = layer.open({type: 1,scrollbar: false,shadeClose: true,title: '批量修改分类',area : ['100%', '100%'],content: $('.batch_category')});
        }else if(event === 'testing'){
            
            var trs = table.cache.table; //表数据
            var count = checkStatus.data.length;//勾选数量
            var open_index = layer.open({
            title:'检测原理/注意事项'
            ,content: "0.将勾选的链接通过服务器获取目标URL的状态码<br /> 1.不能检测内网/备用链接/其他链接(如迅雷等)<br />2.受限于网络的复杂性,检测结果仅供参<br />3.检测结束有问题的链接处于勾选状态<br />4.短时间的频繁请求可能被服务器视为CC攻击<br />5.本功能订阅可用,反馈和建议直接Q我<br />6.红色:无法连通(服务器>链接,不代表本机) <br />7.绿色:正常  黄色:重定向 <br />8.本功能不会修改和删除任何数据<br />"
            ,btn: ['开始检测', '取消']
            ,yes: function(index, layero){
                if($("#subscribe").text() != '1'){
                    layer.msg("未检测到有效订阅,无法使用此功能!",{icon:5});
                    return true;
                }
                var current = 0 ,fail = 0 ,INDEX = 0;
                var testapi = get_api('other_testing_link');
                var div = "div[lay-id='table'] .layui-table-main table tbody tr";
                layer.load(1, {shade: [0.5,'#fff']});//加载层
                layer.msg('正在检测死链接中,请稍后...', {icon: 16,time: 1000*300});
                $("#testing_tip").show();//显示进度提示
                layer.close(open_index); //关闭小窗口
                layer.tips("正在检测中,请勿操作页面...","#testing_tip",{tips: [3, "#3595CC"],time: 9000});
                
                for (let i = 0; i < trs.length; i++) {
                    //未勾选的跳过
                    if(trs[i].LAY_CHECKED != true){continue;}
                    $.post(testapi,{url:trs[i].url},function(re,status){
                        INDEX = trs[i].LAY_INDEX; //行索引
                        if(re.StatusCode == 200 || re.StatusCode == 301 ||  re.StatusCode == 302  ){
                            $("div[lay-id='table'] td .layui-form-checkbox").eq(INDEX).click();//正常的取消勾选
                            if (re.StatusCode  == 200){
                                $(div).eq(INDEX).css("color","limegreen"); //正常的绿色
                            }else{
                                $(div).eq(INDEX).css("color","#ffb800"); //重定向的黄色
                            }
                        }else{
                            fail++;
                            //失败的红色
                            $(div).eq(INDEX).css("color","red");
                            $(div).eq(INDEX).css("font-weight","bold");
                        }
                        current++;
                    });
                }
                //创建定时器等待检测完成
                var wait_id = setInterval(function() {
                    if(current == count){
                        $("#testing_tip").text('检测完毕,异常数:'+fail);
                        layer.closeAll();//关闭所有
                        layer.msg("检测完毕",{icon:1});
                        clearInterval(wait_id);
                        console.log('链接检测完毕,销毁定时器');
                    }else{
                        $("#testing_tip").text('正在检测中 '+current +"/"+count +',异常数:'+fail);
                    }
                }, 100);

                
                return false;
            },btn2: function(index, layero){
                return true;
            },cancel: function(){ 
                return true;
            }
          })
        }else if(event === 'link_extend'){
            extend_data = '';
            index = layer.open({type: 1,scrollbar: false,shadeClose: true,title: '编辑扩展字段',area : ['100%', '100%'],content: $('.link_extend')});
            $.post(get_api('read_link_list','extend_list'),function(data,status){
                if(data.code == 1){
                    extend_data = data.data;
                    table.reload('link_extend_list', {data: extend_data});
                } else{
                    layer.msg(data.msg);
                }
            });
        }else if(event === 'msg_pull'){
            index = layer.open({type: 1,scrollbar: false,shadeClose: true,title: '批量识别链接信息',area : ['100%', '100%'],content: $('.msg_pull')});
        }else if(event === 'push'){
            index = layer.open({type: 1,scrollbar: false,shadeClose: true,title: '推送工具',area : ['100%', '100%'],content: $('.push')});
        }
    });

    $('#start_pull').click(function () {
        let lits = table.checkStatus('table').data; console.log( lits );
        let config = form.val('msg_pull');
        let number = 0;
        let total = lits.length;
        let load_id = layer.load(1, {shade:[0.5,'#fff']});//加载层
        let msg_id = layer.msg('正在识别中', {icon: 16,time: 1000*300}); //进度提示
        //检查是否满足条件
        $.post(get_api('write_link','msg_pull_check'),config,function(data,status){
            if(data.code == 1){
                config.key = data.key;
                start_pull(number); //开始拉取
            }else{
                layer.alert(data.msg || '未知错误',{icon:5,title:'错误',anim: 2,closeBtn: 0,btn: ['刷新页面']},function () {location.reload();});
            }
        });
        function start_pull(number){
            if(number >= total){
                layer.closeAll();
                layer.alert('处理完毕,请刷新页面!' ,{icon:1,title:'提示',anim: 2,shadeClose: false,closeBtn: 0});
                return true;
            }
            $("#layui-layer"+ msg_id+" .layui-layer-padding").html('<i class="layui-layer-face layui-icon layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop"></i>[ ' + number + ' / ' + total + ' ]     正在处理中..');
            config.link_id = lits[number].lid;
            $.post(get_api('write_link','msg_pull'),config,function(data,status){
                number ++;
                start_pull(number);
            });
        }
            
        
        return false;
    });
    
    //开始推送
    $('#start_push').click(function () {
        let checkStatus = table.checkStatus('table');
        tableIds = checkStatus.data.map(function (value) {return value.lid;});
        tableIds = JSON.stringify(tableIds);
        $.post(get_api('other_baidu_push'),{'type':'link','push_api':$('#push_api').val(),'id':tableIds},function(data,status){
            if(data.code == -1){
                layer.msg(data.msg,{icon: 5});
            }else if(data.code == 200){
                layer.alert('成功推送的条数: ' + data.data.success + '<br />当天剩余的可推送条数: ' + data.data.remain + (data.data.not_same_site && data.data.not_same_site.length > 0 ? "<br />未处理的条数(非本站URL): " + data.data.not_same_site.length:'') + (data.data.not_valid && data.data.not_valid.length  > 0 ? "<br />不合法的URL条数: " + data.data.not_valid.length:''));
            }else{
                layer.alert('错误代码: ' + data.data.error + '<br />错误描述: ' + data.data.message);
            }
        });
        return false;
    });
    
    table.render({
        elem: '#link_extend_list'
        ,height: 'full-150'
        ,data: {}
        ,response: {statusCode: 1 } 
        ,method: 'post'
        ,page: false
        ,limit: 1000
        ,even:true
        ,id:'link_extend_list'
        ,loading:true
        ,cols: [[
            {field:'weight',title:'序号',edit:'text',width:80}
            ,{field:'title',title:'标题',edit:'text',width:256}
            ,{field:'name',title:'字段名',edit:'text',width:256}
            ,{field:'type',title:'类型',edit:'text',width:256}
            ,{field:'default',title:'默认值',edit:'text',width:256}
            ,{field:'tip',title:'提示内容',edit:'text',width:256}
            ,{ title:'操作',toolbar:'#link_extend_toolbar',align:'center',width:118}
        ]]
    });
    //监听工具条
    table.on('tool(table)', function (obj) {
        var data = obj.data;
        if (obj.event === 'del') {
            layer.confirm('确认删除?',{icon: 3, title:'温馨提示'}, function(index){
                $.post(get_api('write_link','del'),{lid:data.lid},function(data,status){
                    if(data.code == 1) {
                        obj.del();
                        layer.msg(data.msg, {icon: 1});
                    }else{
                        layer.msg(data.msg, {icon: 5});
                    }
                });
            });
        }else if(obj.event === 'edit') {
            var index = layer.open({
                    title: '编辑链接',
                    type: 2,
                    scrollbar: false,
                    shade: 0.2,
                    maxmin:false,
                    shadeClose: true,
                    area: ['100%', '100%'],
                    content: './index.php?c=admin&page=link_edit&u=' + u +'&id=' + data.lid
                });
        }else if(obj.event === 'edit_category'){
            //点击分类名弹出编辑分类?
        }else if(obj.event === 'pwd'){
            layer.alert( '名称: ' + pwds['pid_' + data.pwd_id].name + '<br>密码: ' + pwds['pid_' + data.pwd_id].pwd,{icon:4,title: data.title + ' - 访问密码',anim: 2,closeBtn: 0});
        }
    });
    
    
    //监听单元格编辑
    table.on('edit(table)', function(obj){
        $.post(get_api('write_link','fast_edit'),{'lid':obj.data.lid,'field':obj.field,'value':obj.value},function(data,status){
            if(data.code == 1){
                $("*").blur();
                layer.msg('修改成功')
                obj.update({up_time:data.t});
            } else{
                layer.msg(data.msg);
            }
        });
    });
    
    //开关监听
    form.on('switch(property)',function(obj) {
	    var sw = obj.elem.checked; //取开关状态
	    var lid = obj.elem.value;
	    var contexts = sw?'私有':'公开';
	    $.post(get_api('write_link','property_sw'), {'lid': lid,'property': sw?'1':'0'},function(data, status) {
			if (data.code == 1) {
				layer.msg('已设为' + contexts );
			} else {
				layer.msg('设为' + contexts + '失败');
			}
		});
    });
    
    //开关监听
    form.on('switch(status)',function(obj) {
	    var sw = obj.elem.checked; //取开关状态
	    var lid = obj.elem.value;
	    var contexts = sw?'启用':'禁止';
	    $.post(get_api('write_link','status_sw'), {'lid': lid,'status': sw?'1':'0'},function(data, status) {
			if (data.code == 1) {
				layer.msg('已设为' + contexts );
			} else {
				layer.msg('设为' + contexts + '失败');
			}
		});
    });
    
    //关闭按钮
    $(document).on('click', '#close', function() {
        layer.close(index);//关闭当前页
    });
    
    //批量修改分类
    form.on('submit(batch_category)', function (data) {
        var fid = $("#batch_category_fid").val();
        if(fid == 0 || fid == null){
            layer.msg('请选择分类',{icon: 5});
            return false;
        }
        
        $.post(get_api('write_link','batch_category'),{lid:IDs,fid:fid},function(data,status){
            if(data.code == 1){
                layer.close(index);
                link_search();
                layer.msg(data.msg,{icon: 1})
            } else{
                layer.msg(data.msg,{icon: 5});
            }
        });
        return false;
    });
    
    //批量操作(通用型:删除/设为公开/设为私有等)
    function batch_operation(d,k){
        $.post(get_api('write_link',k),{lid:d},function(data,status){
            if(data.code == 1){
                link_search();
                layer.msg(data.msg,{icon: 1})
            } else{
                layer.msg(data.msg,{icon: 5});
            }
        });
    }
    
    //手机端操作
    function load_dropdown(){
        var data = [];
        data.push({'title':'删除选中','id':'batch_del'});
        $(".layui-btn-normal.layui-hide-xs").each(function(){
            data.push({'title':$(this).text(),'id':$(this).attr('lay-event')});
        });
        //console.log(data);
        dropdown.render({elem: '#batch'
            ,data: data
            ,click: function(obj){$('#'+ obj.id).click();}
        });
    }
    
    
    //自定义字段行事件
    table.on('tool(link_extend_list)', function (obj) {
        var data = obj.data;
        var row = $(obj.tr).attr("data-index"); //获取行索引
        if (obj.event === 'del') {
            layer.confirm('确认移除？',{icon: 3, title:'温馨提示'}, function(index){
                obj.del();
                layer.close(index);
                layer.msg("移除成功,点击保存后生效!",{icon:1});
            });
        }
    });
    //添加字段
    $('#add_field').click(function () {
        let data = table.cache.link_extend_list;
        let max_weight = 0;
        //找出最大的一个排序值
        for (let i = 0; i < data.length; i++) {
            if( parseInt(data[i].weight) > max_weight ){
                max_weight = parseInt(data[i].weight);
            }
        }
        data.push({
            "title": "请输入标题",
            "name":"请输入字段名(大小写字母或数字)",
            "weight":(max_weight + 1),
            "type":"请输入 text 或 textarea 或 up_img",
            "default":""
        });
        table.reload('link_extend_list', {data: data});
        return false;
    });
    //保存字段
    $('#save_field').click(function () {
        var data = [];
        var tableBak = table.cache.link_extend_list; 
        for (var i = 0; i < tableBak.length; i++) {
            //过滤掉被删除的空数据
            if(typeof tableBak[i].LAY_INDEX == 'number'){
                data.push(tableBak[i]);
            }
        }
        $.post(get_api('write_link','extend_list') ,{list:JSON.stringify(data)},function(data,status){
            if(data.code == 1){
                table.reload("link_extend_list",{data:data.datas}); 
                layer.msg('保存成功', {icon: 1});
            } else{
                layer.msg(data.msg,{icon:5});
            }
        });
        return false;
    });
    
});
