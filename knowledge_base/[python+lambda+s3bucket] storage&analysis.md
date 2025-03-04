# Overview
- A wellness company is currently working on a wearable device that monitors key health metrics such as heart rate, sleep, and steps per day. 
The device is designed to send data to an Amazon S3 bucket for storage and analysis. 
On a daily basis, the device produces 1 MB of data. 
In order to quickly process and summarize this data, the company requires 512 MB of memory and must complete the task within a maximum of 10 seconds.

- AWS 문제집 보다가 웨어러블 디바이스 관련 내용이 나왔는데 여기서 심장박동수 데이터 수집 관련 기능을 AWS Lambda 함수를 통해 구현해보고자 진행하게 되었음.
- 웨어러블 디바이스가 심박수(heart rate), 수면 시간(sleep), 걸음 수(steps) 데이터를 Amazon S3에 업로드하면, Lambda가 이를 자동으로 처리하여 요약(평균 심박수 계산 등)하고 빠르게 반환하는 시스템 구축.

# 테스트 내용
## 버킷 생성
~ $ aws s3 mb s3://kennybaik-bucket
make_bucket: kennybaik-bucket

## lambda 함수 작성
import json
import boto3
import pandas as pd

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    print("Lambda Invoked!")

    bucket_name = event['Records'][0]['s3']['bucket']['name']
    file_key = event['Records'][0]['s3']['object']['key']

    print(f"Reading file from S3 - Bucket: {bucket_name}, Key: {file_key}")

    response = s3_client.get_object(Bucket=bucket_name, Key=file_key)
    file_content = response['Body'].read().decode('utf-8')

    df = pd.read_json(file_content)
    print("DataFrame Loaded:")
    print(df)

    if 'heart_rate' in df.columns:
        avg_heart_rate = df['heart_rate'].mean()
        print(f"Processed {file_key}: 평균 심박수 = {avg_heart_rate}")

    return {
        'statusCode': 200,
        'body': json.dumps(f"Processed file: {file_key}")
    }


## 이벤트 트리거 설정

- lambda가 먼저 s3 버킷에 접속 할 수 있도록 정책 추가
aws $ aws lambda add-permission \
>     --function-name testFunction \
>     --statement-id s3-event-trigger \
>     --action "lambda:InvokeFunction" \
>     --principal s3.amazonaws.com \
>     --source-arn arn:aws:s3:::kennybaik-bucket \
>     --source-account 863518457619

- 반환값:
{
    "Statement": "{\"Sid\":\"s3-event-trigger\",\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"s3.amazonaws.com\"},\"Action\":\"lambda:InvokeFunction\",\"Resource\":\"arn:aws:lambda:ap-northeast-2:863518457619:function:testFunction\",\"Condition\":{\"StringEquals\":{\"AWS:SourceAccount\":\"863518457619\"},\"ArnLike\":{\"AWS:SourceArn\":\"arn:aws:s3:::kennybaik-bucket\"}}}"
}


- 이벤트 트리거 연관 설정 추가
aws $ aws s3api put-bucket-notification-configuration --bucket kennybaik-bucket \
> --notification-configuration '{
>   "LambdaFunctionConfigurations": [
>     {
>       "LambdaFunctionArn": "arn:aws:lambda:ap-northeast-2:863518457619:function:testFunction",
>       "Events": ["s3:ObjectCreated:*"]
>     }
>   ]
> }'


## test_data.json 파일 s3로 업로드

## 테스트할 json파일 만들기
echo '{
  "heart_rate": [75, 80, 72, 68, 90],
  "steps": [5000, 7500, 6800, 8000, 9200],
  "sleep_hours": [6, 7.5, 5, 8, 7]
}' > test_data_202503041300.json

### S3 버킷에 업로드
~ $ aws s3 cp test_data.json s3://kennybaik-bucket/
upload: ./test_data.json to s3://kennybaik-bucket/new_test_data_202503041315.json  

### 실행확인
~ $ aws logs tail /aws/lambda/testFunction --follow
2025-03-04T04:11:51.192000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 INIT_START Runtime Version: python:3.9.v64        Runtime Version ARN: arn:aws:lambda:ap-northeast-2::runtime:57e9dce4a928fd5b7bc1015238a5bc8a9146f096d69571fa4219ed8a2e76bfdf
2025-03-04T04:11:53.510000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 START RequestId: 7075a371-eef7-4495-8c05-3775866ce91b Version: $LATEST
2025-03-04T04:11:53.510000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 Lambda Invoked!
2025-03-04T04:11:53.510000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 Reading file from S3 - Bucket: kennybaik-bucket, Key: new_test_data_202503041310.json
2025-03-04T04:11:53.787000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 /var/task/lambda_function.py:21: FutureWarning: Passing literal json to 'read_json' is deprecated and will be removed in a future version. To read from a literal string, wrap it in a 'StringIO' object.
2025-03-04T04:11:53.787000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 df = pd.read_json(file_content)
2025-03-04T04:11:54.188000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 DataFrame Loaded:
2025-03-04T04:11:54.390000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 heart_rate  steps  sleep_hours
2025-03-04T04:11:54.390000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 0          75   5000          6.0
2025-03-04T04:11:54.390000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 1          80   7500          7.5
2025-03-04T04:11:54.390000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 2          72   6800          5.0
2025-03-04T04:11:54.390000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 3          68   8000          8.0
2025-03-04T04:11:54.390000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 4          90   9200          7.0
2025-03-04T04:11:54.390000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 Processed new_test_data_202503041310.json: 평균 심박수 = 77.0
2025-03-04T04:11:54.448000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 END RequestId: 7075a371-eef7-4495-8c05-3775866ce91b
2025-03-04T04:11:54.448000+00:00 2025/03/04/[$LATEST]ffc6a4547fc04dc0ac86384aa96ae1a0 REPORT RequestId: 7075a371-eef7-4495-8c05-3775866ce91b    Duration: 938.31 ms     Billed Duration: 939 ms Memory Size: 128 MB     Max Memory Used: 122 MB Init Duration: 2316.73 ms


# 문제점
pandas 모듈이 lambda에 포함이 안되어 pandas를 포함한 lambda 배포 패키지로 다시 만들어서 조치함

## 로그 조회 결과: pandas 모듈 에러
~ $ aws logs get-log-events --log-group-name /aws/lambda/testFunction --log-stream-name "2025/03/04/[\$LATEST]1f1da03039bb42ae8d8d5008c99c0f85"
            "message": "[ERROR] Runtime.ImportModuleError: Unable to import module 'lambda_function': No module named 'pandas'\nTraceback (most recent call last):",

## 조치내용: pandas를 포함한 lambda 배포 패키지를 만들어서 업로드함 			
mkdir lambda_package
pip install --target=. pandas
zip -r lambda_package.zip .
aws lambda update-function-code --function-name testFunction --zip-file fileb://lambda_package.zip

echo '{
  "heart_rate": [75, 80, 72, 68, 90],
  "steps": [5000, 7500, 6800, 8000, 9200],
  "sleep_hours": [6, 7.5, 5, 8, 7]
}' > new_test_data_202503041310.json


# Conclusion
- json 데이터를 통해 구현은 완료. 정상동작함.
- 현재 추가 확인중.