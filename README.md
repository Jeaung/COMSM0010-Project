## Prerequisites

1. install aws CLI: pip install awscli

2. execute command 'aws configure'

3. brew install aws-sam-cli

## Deploy Server

1. Create a public s3 bucket on AWS console

2. cd /path/to/server

3. sam package --template-file template.yaml --output-template-file packaged.yaml --s3-bucket {bucket-name} (replace with the bucket name you just created)

4. sam deploy --template-file packaged.yaml --stack-name befree --capabilities CAPABILITY_IAM

5. modify 'host' property in server/config/default.js according to your RDS AWS console

6. redeploy by repeating step 3 and 4

7. Execute initFunction manually on Lambda AWS console. This create matches table in RDS.

8. Execute crawlerFunction manually on Lambda AWS console. This pulls data from api and write it to matches table.

## Deploy Static Website

### Deploy locally for development
1. modify each property in website/config.js according to your Lambda and Cognito AWS console

2. npm install http-server -g

3. cd path/to/website

4. http-server .

### Deploy on S3 for production environment
Open S3 AWS console and upload everything in website directory to your S3 bucket