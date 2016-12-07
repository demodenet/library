class Book {
    constructor(obj) {
        this.title = obj.title;
        this.id = obj.id;
    }

    getTitle() {
        return this.title;
    }

}

export default Book;
