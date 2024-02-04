<?php $title='登录设备'; require 'header.php'; ?>
<body>
<div class="layuimini-container">
    <div class="layuimini-main">
        <table id="table" class="layui-table" lay-filter="table" style="margin: 1px 0;"></table>
    </div>
</div>
<!-- 操作列 -->
<script type="text/html" id="tablebar">
    <a class="layui-btn layui-btn-danger layui-btn-xs" lay-event="out">退出</a>
</script>
<script src = "<?php echo $libs;?>/jquery/jquery-3.6.0.min.js"></script>
<script src = "./templates/admin/js/public.js?v=<?php echo $Ver;?>"></script>
<?php load_static('js');?>
<script>
layui.use(['form','table'], function () {
   var $ = layui.jquery;
   var table = layui.table;
   var form = layui.form;
   var api = get_api('read_login_info'); //列表接口
   var limit = localStorage.getItem(u + "_limit") || 50; //尝试读取本地记忆数据,没有就默认50
   var current_id = 0;
   var cols=[[ //表头
       {field: 'id', title: 'ID', width:60, sort: true,hide:true}
      ,{ title: '操作',toolbar: '#tablebar',width:70}
      ,{field: 'ip', title: '登录IP',sort:true, width:150,}
      ,{field: 'login_time', title: '登录时间', width:160, sort: true,templet:function(d){
        return timestampToTime(d.login_time);;
      }}
      ,{field: 'last_time', title: '最后访问时间', width:160, sort: true,templet:function(d){
        return timestampToTime(d.last_time);;
      }}
      ,{field: 'expire_time', title: '到期时间', width:160, sort: true,templet:function(d){
        return d.expire_time <= 0 ? '':timestampToTime(d.expire_time);
      }}
      ,{field: 'ua', title: '浏览器UA'}
    ]]
    
    table.render({
        elem: '#table'
        ,height: 'full-50' //自适应高度
        ,url: api //数据接口
        ,page: true //开启分页
        ,limit:limit  //默认每页显示行数
        ,limits: [20,50,100,300,500]
        ,even:true //隔行背景色
        ,loading:true //加载条
        ,id:'table'
        ,cols: cols
        ,method: 'post'
        ,response: {statusCode: 1 } 
        ,done: function (res, curr, count) {
            current_id = res.current_id;
            var temp_limit = $(".layui-laypage-limits option:selected").val();
            if(temp_limit > 0 && localStorage.getItem(u + "_limit") != temp_limit){
                localStorage.setItem(u + "_limit",temp_limit);
            }
            //遍历表格数据,标记当前设备
            layui.each(table.cache.table, function(index, item){
                if(item.id == res.current_id){
                    let tr = $('.layui-table-body.layui-table-main tr[data-index="' + index + '"]');
                    tr.css('color', 'red');
                    tr.attr('title','当前设备');
                    return false; 
                }
            });
        }
    });
    
    table.on('tool(table)', function (obj) {
        var data = obj.data;
        if (obj.event === 'out') {
            if(data.id == current_id ){
                $.post('./index.php?c=admin&page=logout&u='+u,function(res,status){
                    if(res.code == 1) {
                        layer.alert("您已安全的退出登录!", function () {
                            top.location.href='./index.php?u='+u;
                        });
                    }else{
                        layer.msg(res.msg,{icon: 5});
                    }
                });
            }else{
                $.post(get_api('write_login_info','out'),{id:data.id},function(res,status){
                    if(res.code == 1) {
                        obj.del();
                        layer.msg(res.msg, {icon: 1});
                    }else{
                        layer.msg(res.msg, {icon: 5});
                    }
                });
            }

        }
    });
    
});
</script>
</body>
</html>