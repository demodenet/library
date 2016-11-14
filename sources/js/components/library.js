class Reader {
    constructor(idReader, firstName, lastName) { 
    	this.idReader = idReader;
        this.firstName = firstName;
        this.lastName = lastName;
    }
}
 
var firstReader = new Reader(1, 'Sylwia', 'Rybicka');
 
console.log(firstReader.idReader);





class Book {
   constructor(titleBook){
   	    this.titleBook = titleBook;
   }

}