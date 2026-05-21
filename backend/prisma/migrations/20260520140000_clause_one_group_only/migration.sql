-- Mỗi điều khoản chỉ thuộc một nhóm: xóa bản ghi trùng (giữ bản ghi id nhỏ nhất theo clause_id)
DELETE FROM "contract_clause_group_members" AS a
USING "contract_clause_group_members" AS b
WHERE a."clause_id" = b."clause_id" AND a."id" > b."id";

CREATE UNIQUE INDEX "uniq_contract_clause_group_member_clause" ON "contract_clause_group_members"("clause_id");
