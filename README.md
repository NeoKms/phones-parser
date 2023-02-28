### Монорепозиторий системы автоматической оплаты телефонов
#### Описание
Система предназначена для автоматической и автоматизированной оплаты телефонов и агрегации данных по ним.
По заданному интервалу времени заходит в личные кабинеты добавленных в систему номеров телефонов и собирает
данные по ним, как баланс, тариф, пакеты услуг, профиль. По API токенам системы оплаты QIWI оплачивает
автоматически или по нажатию подтверждения, либо сумму для оплаты действующего тарифа, либо
поддерживает указанную минимальную сумму на счету. 
На главной странице ведет лог действий с их описанием.
#### Функционал
1. Парсинг и агрегация информации о номере телефона из ЛК сотовых операторов
2. Поддержание указанной суммы на балансе
3. Оплата тарифов в день списания
4. Смена паролей от личных кабинетов
5. Менеджмент паролей с группировками по сотовому оператору
6. Менеджмент QIWI токенов дла оплаты
#### Работает с сотовыми операторами:
теле2, мегафон, билайн, мтс
#### Технологический стек под капотом
```MariaDB, Redis, RabbitMQ, VueJS (Vite, Pinia, Scss, Vuetify и др.), NodeJS 18+ (Websockets, Puppeteer, Cheerio, Express и др.)  ```
### Разработка и запуск
#### Установка на Windows
1. Установить Docker Desktop
2. Запустить Docker Desktop и дождаться полного запуска движка
3. Запустить ```start-app.bat``` (возможно понадобится от имени администратора, если у пользователя ограничены права)
4. Перейти на ```http://localhost:5173```
#### Установка на сервер Ubuntu
1. Скопировать ```install_on_ubuntu.sh```
2. Скопировать ```docker-compose.yaml```
3. Работает на портах ```5173, 3000, 9000```
4. Настроить домены и веб-сервер на нужные порты и прописать их в ```docker-compose.yaml```
5. Запустить ```install_on_ubuntu.sh```
6. Если взаимодействие будет не на localhost, то нужно передать переменные окружения внутрь приложения интерфейса ```VUE_API_URL - доменное имя API, VUE_WS_URL - доменное имя вебсокет-сервера``` и запустить ```getenv.sh``` 
#### Разработка на Windows
1. Установить Docker Desktop
2. Запустить Docker Desktop и дождаться полного запуска движка
3. Установить NodeJS
4. Запустить ```start-app.dev.bat```
5. В ```api/```
   1. ```npm install```
   2. Скопировать ```.env.example``` в ```.env``` и заполнить необходимыми параметрами (можно взять из ```docker-compose.yaml```)
   2. ```npm run start:app```
   3. ```npm run start:wss```
6. В ```front/```
   1. ```npm install```
   2. ```npm run dev```
#### Разработка на других системах
1. Установить Docker, Docker-compose и NodeJS
2. Запустить ```docker-compose -f docker-compose.dev.yaml up -d```
3. Сделать пункты 5 и 6 из списка выше

