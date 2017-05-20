import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFireDatabase } from 'angularfire2/database';
import { Router } from '@angular/router';
import * as firebase from 'firebase/app';
import 'rxjs/add/operator/take';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/filter';

interface IUser {
    uid?: string;
    photoUrl?: string;
    displayName?: string;
    photoURL?: string;
    email?: string;
}

@Injectable()
export class LoginService {
    private _isLoggedIn = false;
    private _isAdmin = false;
    private _userUid: string;

    get isLoggedIn(): boolean {
        if (!this._isLoggedIn) {
            return localStorage.getItem('isLoggedIn') === 'true';
        }
        return this._isLoggedIn;
    }

    set isLoggedIn(value: boolean) {
        this._isLoggedIn = value;
    }

    get isAdmin(): boolean {
        return this._isAdmin;
    }

    set isAdmin(value: boolean) {
        this._isAdmin = value;
    }

    get userUid(): string {
        if (!this._userUid) {
            return localStorage.getItem('uid');
        }
        return this._userUid;
    }

    set userUid(value: string) {
        this._userUid = value;
    }

    constructor(private afAuth: AngularFireAuth, private db: AngularFireDatabase, private router: Router) {
    }

    public login(): void {
        if (!this.isLoggedIn) {
            this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(() => {
                this.afAuth.authState.filter(user => !!user).subscribe((user: IUser) => {
                    this.isLoggedIn = true;
                    this.userUid = user.uid;
                    this.setLocalStorage(user);
                    this.updateUser(user);
                    this.setIsAdmin(user);
                    this.router.navigate(['/dashboard']);
                });
            });
        }
    }

    public logout(): void {
        this.afAuth.auth.signOut().then(() => {
            this.isLoggedIn = false;
            this.isAdmin = false;
            localStorage.clear();
            this.router.navigate(['/login']);
        });
    }

    private setLocalStorage(user: IUser) {
        localStorage.setItem('isLoggedIn', user.uid ? 'true' : 'false');
        localStorage.setItem('uid', user.uid);
        localStorage.setItem('photoUrl', user.photoURL);
        localStorage.setItem('displayName', user.displayName);
        localStorage.setItem('email', user.email);
    }

    private updateUser(user: IUser) {
        this.db.object('/users/' + user.uid)
            .take(1)
            .subscribe(
                data => {
                    if (!data.$value) {
                        this.db.object('/users/' + user.uid).update({
                            displayName: user.displayName,
                            photoUrl: user.photoURL,
                            email: user.email
                        });
                    }
                },
                error => console.error(error)
            );
    }

    private setIsAdmin(user: IUser) {
        this.db.object('/users/' + user.uid + '/isAdmin').subscribe(
            data => {
                if (!data.$value) {
                    this.db.object('/users/' + user.uid + '/isAdmin').set(false);
                } else {
                    this.isAdmin = !!data.$value;
                }
            },
            error => console.error(error)
        );
    }

}