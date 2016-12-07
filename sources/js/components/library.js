import Book from "./book";

class Library {
    constructor() {
        this.bookshelf = [];
        this.$ui = $('.ui');

        this.getBooks()
            .then(this.processBooks.bind(this))
            .then(this.allowUI.bind(this));

        this.bindUI();
    }

    allowUI() {
        this.$ui.show();
    }

    bindUI() {
        $('.js-list-books').on('click', this.listBooksTitle.bind(this));
    }

    getBooks() {
        return $.ajax({
            dataType: 'json',
            url: '../data/bookList.json'
        });
    }

    /**
     * przetwarzanie danych z json
     * @param data
     */
    processBooks(data) {
        data.books.forEach(this.assignBook.bind(this));
    }

    assignBook(obj) {
        this.bookshelf.push(new Book(obj));
    }

    listBooksTitle() {
        console.log('Posiadam książki: ');
        this.bookshelf.forEach(book => {
            console.log(book.getTitle());
        });
    }
}


export default Library;
