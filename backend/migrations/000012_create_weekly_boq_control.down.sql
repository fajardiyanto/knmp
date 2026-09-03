DROP TABLE IF EXISTS weekly_boq_items;
DROP TABLE IF EXISTS weekly_boq_controls;

DELETE FROM role_has_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE name IN ('boq_create', 'boq_read', 'boq_update', 'boq_delete')
);

DELETE FROM model_has_permissions
WHERE permission_id IN (
    SELECT id FROM permissions WHERE name IN ('boq_create', 'boq_read', 'boq_update', 'boq_delete')
);

DELETE FROM permissions
WHERE name IN ('boq_create', 'boq_read', 'boq_update', 'boq_delete');
