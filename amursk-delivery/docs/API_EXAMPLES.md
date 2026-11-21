# Короткие примеры API

После запуска API на `http://localhost:3000`:

```bash
# Проверка сервиса
curl http://localhost:3000/api/health

# Регистрация
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"ChangeThisPassword123","displayName":"Тестовый житель"}'

# В ответе вернутся token и user. Подставьте token вместо YOUR_JWT.
# Создание объявления
curl -X POST http://localhost:3000/api/listings \
  -H 'Authorization: Bearer YOUR_JWT' -H 'Content-Type: application/json' \
  -d '{"category":"Подработка","subcategory":"Помощь по дому","title":"Нужна помощь перенести шкаф","description":"Нужно помочь сегодня вечером, оплата после работы.","price":500,"district":"Центральный район"}'

# Общая лента
curl http://localhost:3000/api/listings
```

Для теста чата сначала создайте объявление одним пользователем, войдите вторым пользователем и отправьте `POST /api/conversations` с `listingId`. Затем используйте возвращённый `conversationId` для GET/POST messages. Участником чата является только автор объявления и пользователь, который открыл диалог; новый запрос создаёт отдельный приватный диалог.
