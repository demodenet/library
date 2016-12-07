class Book {
    constructor(obj) {
        this.title = obj.title;
        this.id = obj.id;
    }

    /**
     * get title
     * @returns {string|string|*|string}
     */
    getTitle() {
        return this.title;
    }

}

export default Book;
