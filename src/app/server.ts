import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class Server {
  constructor(private http: HttpClient) { }
  public urlFinal = "https://chettinadlink.cal4care.com/api/";


  sendServer(postData: any, options: any = {}): Observable<any> {
    const accessToken = localStorage.getItem('access_token');
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      ...options
    };
    let url = this.urlFinal + postData.api_url;
    let posting: any[] = postData;
    return this.http.post(url, posting, httpOptions);
  }


  sendServerGet(postData: any) {

    const accessToken = localStorage.getItem('access_token');
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    };
    let url = this.urlFinal + postData.api_url;
    let posting: any[] = postData;
    return this.http.get(url, httpOptions);
  }

  // PURCHASE ENTRY 

  sendServerPurchaseEntry(postData: any) {

    const accessToken = localStorage.getItem('access_token');
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    };
    let url = this.urlFinal + postData.moduleType + '/' + postData.api_url;
    let posting: any[] = postData;
    return this.http.post(url, posting, httpOptions);
  }
  sendServerPurchaseEntryGET(postData: any) {

    const accessToken = localStorage.getItem('access_token');
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    };
    let url = this.urlFinal + postData.moduleType + '/' + postData.api_url + '/' + postData.id;
    let posting: any[] = postData;
    return this.http.get(url, httpOptions);
  }

  // PURCHASE ENTRY ENDS //


  sendServerGetID(postData: any) {

    const accessToken = localStorage.getItem('access_token');
    const httpOptions = {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    };
    let url = this.urlFinal + postData.api_url + '/' + postData.id;
    let posting: any[] = postData;
    return this.http.get(url, httpOptions);
  }

  sendService2(postData: any): Observable<any> {
    const accessToken = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    });
    return this.http.get<any>(`${this.urlFinal}${postData.api_url}/${postData.id}`, { headers });
  }
  //   public invurl = "https://laravelapi.erp1.cal4care.com/api/";
  //   sendServerInv(postData: any) {
  //   const httpOptions = {
  //     headers: new HttpHeaders({
  //       'Content-Type': 'application/json',
  //     }),
  //   };
  //   let url = this.invurl + postData.api_url;
  //   let posting: any[] = postData;
  //   return this.http.post(url, posting, httpOptions);
  // }

}
