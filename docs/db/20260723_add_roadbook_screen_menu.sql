-- 路书大屏菜单
-- 说明：
-- 1. 大屏由前端独立顶级路由 /screen 承载，不属于后台管理 Layout。
-- 2. 本菜单只负责后台侧边栏的跳转入口，前端不会将它重复注册为动态页面路由。
-- 3. 脚本可重复执行，通过路由地址和组件路径避免重复插入。
-- 4. 按项目既有约定，为普通联调角色 role_id = 2 追加菜单授权。

INSERT INTO sys_menu (
    menu_name,
    parent_id,
    order_num,
    path,
    component,
    query,
    route_name,
    is_frame,
    is_cache,
    menu_type,
    visible,
    status,
    perms,
    icon,
    create_by,
    create_time,
    update_by,
    update_time,
    remark
)
SELECT
    '路书大屏',
    0,
    1,
    '/screen',
    'screen/index',
    NULL,
    'RoadbookScreen',
    1,
    1,
    'C',
    '0',
    '0',
    'trip:screen:view',
    'guide',
    'admin',
    NOW(),
    '',
    NULL,
    'PC 路书地图大屏入口'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1
    FROM sys_menu
    WHERE path = '/screen'
      AND component = 'screen/index'
);

SET @roadbook_screen_menu_id = (
    SELECT menu_id
    FROM sys_menu
    WHERE path = '/screen'
      AND component = 'screen/index'
    ORDER BY menu_id
    LIMIT 1
);

INSERT INTO sys_role_menu (role_id, menu_id)
SELECT 2, @roadbook_screen_menu_id
FROM DUAL
WHERE @roadbook_screen_menu_id IS NOT NULL
  AND EXISTS (
      SELECT 1
      FROM sys_role
      WHERE role_id = 2
  )
  AND NOT EXISTS (
      SELECT 1
      FROM sys_role_menu
      WHERE role_id = 2
        AND menu_id = @roadbook_screen_menu_id
  );

-- 如需回滚，请先删除角色菜单关系，再删除菜单。
-- DELETE FROM sys_role_menu WHERE menu_id = @roadbook_screen_menu_id;
-- DELETE FROM sys_menu WHERE menu_id = @roadbook_screen_menu_id;
