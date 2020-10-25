import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'lectores-escritores';
  public database = {
    isWriting: false,
    isReading: false,
    writerId: 0,
    usersNumber: 0,
    usersWaiting: [],
    usersReading: []
  }
  public userId: number;
  public iWaiting: boolean;
  public iReading: boolean;

  constructor(
    private firestore: AngularFirestore,
  ) {

    this.userId = Number(localStorage.getItem('userId'));
    this.getSettingsFromDB().subscribe( (data: any) => {
      this.database = data;

      if( !this.userId ){
        localStorage.setItem('userId', (this.database.usersNumber + 1).toString() );
        this.userId = Number(localStorage.getItem('userId'));
        this.updateUsersNumber();
      }

      this.database.usersReading.forEach( item => {
        if( item == this.userId ){
          console.log('Estas leyendo el recurso');
          return this.iReading = true;
        }
      });

      this.database.usersWaiting.forEach( item => {
        if( item == this.userId ){
          console.log('Estas en cola de espera');
          return this.iWaiting = true;
        }
      });

    });

  }

  public ingresar(): void {
    this.database.usersWaiting.push( this.userId );
    this.updateUsersWaiting();
  }


  /**
   *  LECTOR
   */
  public iniciarLectura(): void {
    if( !this.database.isWriting ){
      this.iWaiting = false;
      this.database.usersWaiting.splice(0, 1);
      this.database.usersReading.push( this.userId );
      this.updateRead( true );
    }
  }
  public finalizarLectura( userIndex: number ): void {
    this.deleteUser( userIndex );
    if( this.database.usersReading.length == 0 ){
      this.updateRead( false );
    } else{
      this.updateRead( true );
    }
    this.iReading = false;
  }
  private deleteUser( userIndex: number ) {
    this.database.usersReading.splice(userIndex, 1);
  }


  /**
   *  ESCRITOR
   */
  public iniciarEscritura(): void {
    if( !this.database.isReading && !this.database.isWriting ){
      this.iWaiting = false;
      this.database.usersWaiting.splice(0, 1);
      this.updateWrite( true, this.userId );
    }
  }

  public finalizarEscritura(): void {
    if( this.database.isWriting && (this.database.writerId == this.userId ) ){
      this.updateWrite( false, 0 );
    }
  }


  public trackByItems( index: number, item: any ): number{
    return item.id;
  }


  /**
   *  DATABASE
   */
  private getSettingsFromDB() {
    const dataReference = this.firestore.collection('settings').doc('items');
    return dataReference.valueChanges();
  }

  public async updateRead( status: boolean ) {
    await this.firestore.collection('settings').doc('items').update(
      {
        'isReading': status,
        'usersWaiting': this.database.usersWaiting,
        'usersReading': this.database.usersReading,
      }
    )
      .then( () => console.log('Lectura actualizada') )
      .catch( error => console.error('Error al actualizar Lectura') );
  }

  public async updateWrite( status: boolean, id: number ) {
    await this.firestore.collection('settings').doc('items').update(
      {
        'isWriting': status,
        'usersWaiting': this.database.usersWaiting,
        'writerId': id
      }
    )
      .then( () => console.log('Escritura actualizada') )
      .catch( error => console.error('Error al actualizar Escritura') );
  }

  public async updateUsersNumber() {
    await this.firestore.collection('settings').doc('items').update(
      {
        'usersNumber': this.userId,
      }
    )
      .then( () => console.log('Usuario actualizado') )
      .catch( error => console.error('Error al actualizar Usuario') );
  }

  public async updateUsersWaiting() {
    await this.firestore.collection('settings').doc('items').update(
      {
        'usersWaiting': this.database.usersWaiting,
      }
    )
      .then( () => console.log('Cola espera actualizada') )
      .catch( error => console.error('Error al actualizar Cola espera') );
  }

}
