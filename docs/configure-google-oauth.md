# log into google cloud platform

https://console.cloud.google.com/ 

### Create new project

Create new project and make sure to select it 

### Go to `[**Credentials**](https://console.developers.google.com/apis/credentials)` Tab


### Configure consent screen and fill App info
Click on **CONFIGURE CONSENT SCREEN** then Get Started 
then Fill the App info and make sure to select **External** for **Audience**

### Create client 
Create Oauth client 

Select Web Application 

Give it Name 

Click on ADD URI for Authorised JavaScript origins
give it : http://localhost:3000 

then for Authorised redirect URIs

Add URI and fill it  with : http://localhost:3000/api/auth/callback/google

click Create 

### Configure the scopes
In Data access tab 
Click on add and select **../auth/userinfo.email** and **../auth/userinfo.profile** 
**UPDATE ,** then **SAVE**

### Test Users
In Audience Tab

Add users emails allow us to test login with google functionality , **SAVE**

### Get Credentials 
in Clients Tab click in download Icon under Actions for our project and copy Client id and Client secret ; or download it
Add it to our Env file 