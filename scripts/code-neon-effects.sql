-- Auto-generated conditions and effects for "Código Neon"

INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('6fd9db46-c352-4d78-b269-af164a131bcb', '5b132965-00aa-42c8-85bb-37143f077312', 'trust_nix', 'eq', 'true'::jsonb);
INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('9f1d5cb1-aa8d-463d-9eae-5e3e695d27d6', 'a90f96f3-ddc2-4414-a264-69c7afa8dc3b', 'trust_nix', 'eq', 'false'::jsonb);
INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('e16b7dfd-78f8-4663-bc95-da3577d1d912', '3247c098-2a9a-4106-9978-58522a14363b', 'independent', 'eq', 'true'::jsonb);
INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('fb11b3ca-a843-4216-80f3-37668ab441f8', '46234cb0-8621-4e50-b822-63259b22170a', 'trust_nix', 'eq', 'true'::jsonb);
INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('20f8552f-1f79-4d05-9286-fe450473abca', 'fd720dd0-6c01-445f-90fa-78d9e1fc60e3', 'independent', 'exists', 'true'::jsonb);
INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('982a4001-d5d2-4eb0-9ad2-000ffdf129f9', '1e9a54bd-3c28-4af9-8602-61699f2d5b6b', 'trust_nix', 'exists', 'true'::jsonb);
INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('ede441e7-729b-40ab-a20a-c0a927318340', 'fa087fcc-2438-4098-8410-be845ae25eda', 'trust_nix', 'eq', 'true'::jsonb);
INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('6deee7be-0b3c-48e4-9a11-2f1e1815331e', '24a580ed-bbdd-4c54-8f50-3a2ffd9b008f', 'independent', 'eq', 'true'::jsonb);
INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('63ef40fb-f3e3-446e-8b27-fd567d505d1f', '41108eb0-18a7-4789-8975-0f3e2520cdea', 'independent', 'eq', 'true'::jsonb);
INSERT INTO choice_conditions (id, choice_id, variable_name, operator, value) VALUES ('26f516d1-358a-4769-ba3c-e68aed553fb1', '750bba12-800c-46a6-b0ab-eb4bba1979e9', 'ending', 'exists', 'true'::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('bf344ef5-36bf-4c9a-8483-a11cea73ece2', '5b132965-00aa-42c8-85bb-37143f077312', 'trust_nix', 'set', 'true'::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('b472ba0c-9418-4436-87a2-4c8e23ed3750', '5b132965-00aa-42c8-85bb-37143f077312', 'ally', 'set', ""nix""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('9b055bcc-d407-4ed4-893d-4780e0c34479', 'a90f96f3-ddc2-4414-a264-69c7afa8dc3b', 'trust_nix', 'set', 'false'::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('9eae7416-57ac-4ba6-897c-ec142fd24a18', 'a90f96f3-ddc2-4414-a264-69c7afa8dc3b', 'independent', 'set', 'true'::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('1158f033-89fd-4057-a7a2-e9d8cc8c8e8d', '3247c098-2a9a-4106-9978-58522a14363b', 'approach', 'set', ""stealth""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('c3967144-479e-47ec-b9d1-a79ca53dc296', '3247c098-2a9a-4106-9978-58522a14363b', 'risk_level', 'set', ""high""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('02513ae8-b44e-441f-8722-c931021e94a6', '46234cb0-8621-4e50-b822-63259b22170a', 'approach', 'set', ""social""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('b40cb85b-19a1-4a22-830b-7ab0898a08a2', '46234cb0-8621-4e50-b822-63259b22170a', 'risk_level', 'set', ""low""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('d8851c3d-62c6-4def-b504-c07eba766a3d', 'fd720dd0-6c01-445f-90fa-78d9e1fc60e3', 'approach', 'set', ""stealth""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('e94e9680-e94a-4875-9ff6-64656ec1e249', '1e9a54bd-3c28-4af9-8602-61699f2d5b6b', 'approach', 'set', ""social""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('06ec51a9-bc49-4f8c-9b7d-44d87c931994', 'fa087fcc-2438-4098-8410-be845ae25eda', 'ending', 'set', ""allies""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('8e0f5efc-a2a6-4517-8736-45811f64b117', '24a580ed-bbdd-4c54-8f50-3a2ffd9b008f', 'ending', 'set', ""lone_wolf""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('1dc52c95-d670-4a45-a3d6-bc714bee3f80', '41108eb0-18a7-4789-8975-0f3e2520cdea', 'ending', 'set', ""pragmatist""::jsonb);
INSERT INTO choice_effects (id, choice_id, variable_name, action, value) VALUES ('965a9001-2911-40bf-8030-265cc00c83d1', '750bba12-800c-46a6-b0ab-eb4bba1979e9', 'ending', 'set', ""silence""::jsonb);
