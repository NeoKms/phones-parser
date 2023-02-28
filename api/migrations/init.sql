SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


DROP TABLE IF EXISTS `passwords`;
CREATE TABLE `passwords`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `operator` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

INSERT INTO `passwords` VALUES (1, "7777", 'megafon', 'Пароль мегафона вариант 2');
INSERT INTO `passwords` VALUES (2, "7777", 'mts', 'пароль мтс');
INSERT INTO `passwords` VALUES (3, "7777", 'tele2', 'пароль теле2');
INSERT INTO `passwords` VALUES (4, "7777", 'beeline', 'пароль билайн');
INSERT INTO `passwords` VALUES (5, "7777", 'megafon', 'пароль мегафон вариант 1');

DROP TABLE IF EXISTS `qiwi_tokens`;
CREATE TABLE `qiwi_tokens`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT 1,
  `balance` int NULL DEFAULT 0,
  `limit` int NULL DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uniquetokenval`(`token`) USING BTREE
);

DROP TABLE IF EXISTS `phones`;
CREATE TABLE `phones`  (
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'сам номер формата без +7 и 8',
  `password_id` int NULL DEFAULT NULL COMMENT 'ссылка на пароль',
  `current_password` text NOT NULL COMMENT 'текущий пароль',
  `auto_pay` tinyint NOT NULL DEFAULT 0 COMMENT 'автоматически оплачивать',
  `min_value` int NULL DEFAULT NULL COMMENT 'необходимая минимальная сумма на кошельке',
  `fio` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT 'фио держателя из лк',
  `is_active` tinyint NOT NULL DEFAULT 1 COMMENT 'парсить ли вообще этот номер',
  `sip` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `tariff_cost` int NULL DEFAULT NULL COMMENT 'стоимость тарифа из лк',
  `balance` int NULL DEFAULT NULL COMMENT 'актуальный баланс',
  `gb_packet` text NULL DEFAULT NULL COMMENT 'пакет гб в тарифе',
  `gb_available` text NULL DEFAULT NULL COMMENT 'актуальное значение гб',
  `tariff_date` int NULL DEFAULT NULL COMMENT 'дата оплаты по тарифу',
  `last_error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '(Пустое поле) - мегафон, пароль вариант 1\r\n\r\n1 -  мегафон, пароль вариант 2\r\n\r\n2 - МТС, пароль от МТС\r\n\r\n3 - Теле2, пароль от Теле2\r\n\r\n4 - Биллайн, пароль от билайн\r\n\r\n',
  `qiwi_token_id` int NULL DEFAULT NULL COMMENT 'конкретный токен киви для оплаты этого номера',
  `last_pars_timestamp` int NULL DEFAULT NULL COMMENT 'метка времени последнего парсинга',
  `status` int NULL DEFAULT 0 COMMENT 'находится ли сейчас в очереди на парсинг. 0 - не в очереди. 1 - в очереди',
  `in_pay` int NULL DEFAULT 0 COMMENT 'находится ли сейчас в очереди на оплату. 0 - нет ,1 -да',
  PRIMARY KEY (`phone`) USING BTREE,
  INDEX `passsid`(`password_id`) USING BTREE,
  CONSTRAINT `passsid` FOREIGN KEY (`password_id`) REFERENCES `passwords` (`id`) ON DELETE SET NULL ON UPDATE SET NULL,
  CONSTRAINT `qiwitokenphone` FOREIGN KEY (`qiwi_token_id`) REFERENCES `qiwi_tokens` (`id`) ON DELETE SET NULL ON UPDATE SET NULL
);

DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` int NOT NULL COMMENT 'дата создания',
  `finished_at` int NULL DEFAULT NULL COMMENT 'дата завершения',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` int NULL DEFAULT 0 COMMENT '0 - создано, 1 - в работе, 2 - закончено успешно, 3 - закончено с ошибкой, 4 - отменено',
  `action_type` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT 'парсинг, смена пароля, запрос кода, принятие кода, оплата киви',
  `error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT 'текст ошибки',
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '{}' COMMENT 'сумма для оплаты киви, код запроса смс',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `phoneidmes`(`phone`) USING BTREE,
  CONSTRAINT `phoneidmes` FOREIGN KEY (`phone`) REFERENCES `phones` (`phone`) ON DELETE CASCADE ON UPDATE CASCADE
);


DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs`  (
  `timestamp` int(11) NULL DEFAULT NULL,
  `route` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `action_type` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL
);

DROP TABLE IF EXISTS `app_config`;
CREATE TABLE `app_config`  (
  `key` varchar(50) NULL,
  `value` text NULL,
  UNIQUE INDEX `keyunicserv`(`key`) USING BTREE
);
INSERT INTO `app_config`(`key`, `value`) VALUES ('working', '0');

DROP TABLE IF EXISTS `all_data`;
CREATE TABLE `all_data`  (
  `phone` varchar(20) NOT NULL,
  `profile` longtext NULL DEFAULT '{}',
  `balance` longtext NULL DEFAULT '{}',
  `GB` longtext NULL DEFAULT '{}',
  `additional` longtext NULL DEFAULT '{}',
  `tariff` longtext NULL DEFAULT '{}',
  PRIMARY KEY (`phone`),
  CONSTRAINT `phoneidfull` FOREIGN KEY (`phone`) REFERENCES `db_parser`.`phones` (`phone`) ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE IF EXISTS `qiwi_transactions`;
CREATE TABLE `qiwi_transactions`  (
  `qid` int NOT NULL,
  `timestamp` int NOT NULL,
  `val` int NULL,
  PRIMARY KEY (`qid`,`timestamp`),
  CONSTRAINT `qidid` FOREIGN KEY (`qid`) REFERENCES `db_parser`.`qiwi_tokens` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
