import Book from "./book";

class Library {
    constructor() {
        this.bookshelf = [];
        this.$ui = $('.ui');
        this.$formButton = $('button');

        this.getBooks()
            .then(this.processBooks.bind(this))
            .then(this.bindUI.bind(this));
    }

    bindUI() {
        this.$ui.filter('.js-list-books').on('click', this.listBooksTitle.bind(this));
        this.$ui.show();
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

    processBooksForm(){
        this.$formButton.on('click', function(){
            console.log('sdcscd');
        })
    }
}


export default Library;
