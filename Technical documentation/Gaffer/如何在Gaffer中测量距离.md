通常这个测量是为了获取相机到画面中心的数据，然后以此确定渲染设置上景深焦点的位置
可以查看
https://help.autodesk.com/view/ARNOL/ENU/?guid=arnold_user_guide_ac_cameras_common_parameters_html
的Focus Distance
![[Pasted image 20261014172518.png]]那么在缺少一个像UE那样可视化调整的工具的情况下
我们只能寄希望于通过节点来计算出一个数值，然后我们再手动填进去

在Gaffer中有osl节点可以