# Model

`Model` это базовый класс для описания структур данных на клиенте.

Класс при создании принимает единственный параметр `props` типа [OJSON](./ojson.ru.md)

Основная задача класса обеспечить уникальность данных в зависимости от параметров конструктора.

Т.е. всегда выполняется правило:
```ts
const params1: OJSON = {id: 1};
const params2: OJSON = {id: 1};
// params1 === params2 ==> false

const model1 = construct(MyModel, params1)
const model2 = construct(MyModel, params2)
// model1 === model2 ==> true
```

При этом создать класс напрямую, с помощью `new` нельзя. Для этого нужно использовать функцию [construct](./utils.ru.md#construct)

У класса нет собственных видимых полей, но есть несколько [#{T}](./accessors.ru.md)
для доступа к внутреннему состоянию.

## Объявление полей

Любой параметр объявленный на производных классах считается частью структуры данных.

Парамерты могут быть пустыми или заранее проинициализированными значением по умолчанию.

```ts
import { Model } from '@modelsjs/model';

class TodoItem extends Model {
    id!: string;

    title!: string;

    done: boolean = false;

    deadline?: number;
}
```
К параметрам могут применяться дополнительные [декораторы]().

В следующем примере используется декоратор [@map](),
который превращает коллекцию данных в коллекцию указанных моделей. 

```ts
import { Model, map } from '@modelsjs/model';
import { TodoItem } from './TodoItem';

class TodoList extends Model {
    id!: string;
    
    @map('id', TodoItem)
    items!: TodoItem[];
}
```
