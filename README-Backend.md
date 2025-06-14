# Family Command Center - Backend API

A serverless backend API built with AWS Lambda, API Gateway, and DynamoDB to power the Family Command Center application.

## 🏗️ Architecture

- **Frontend**: Vue.js application (GitHub Pages)
- **API**: AWS API Gateway + Lambda Functions
- **Database**: DynamoDB (single table design)
- **Infrastructure**: CloudFormation

## 📁 Project Structure

```
src/
├── handlers/           # Lambda function entry points
│   ├── choreHandler.js     # Chore API endpoints
│   └── quicklistHandler.js # Quicklist API endpoints
├── controllers/        # Request/response handling
│   ├── ChoreController.js
│   └── QuicklistController.js
├── services/          # Business logic
│   ├── ChoreService.js
│   └── QuicklistService.js
├── models/            # Data models
│   ├── Chore.js
│   └── QuicklistChore.js
├── config/            # Configuration
│   └── dynamodb.js
├── utils/             # Utilities
│   └── response.js
└── package.json       # Dependencies
```

## 🚀 Deployment

### Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js** 18+ installed
3. **Git Bash** or similar shell (for Windows users)

### Quick Deploy

```bash
# Make deploy script executable
chmod +x deploy.sh

# Deploy to development environment
./deploy.sh dev

# Deploy to production
./deploy.sh prod
```

### Manual Deployment Steps

1. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, Region, and Output format
   ```

2. **Deploy Infrastructure**:
   ```bash
   aws cloudformation deploy \
     --template-file cloudformation-template.yaml \
     --stack-name family-command-center-dev \
     --parameter-overrides Environment=dev \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Package and Deploy Lambda Code**:
   ```bash
   cd src
   npm install --production
   zip -r ../lambda-deployment.zip .
   cd ..
   
   # Update Lambda functions with your code
   # (You'll need to update the CloudFormation template to reference your S3 bucket)
   ```

## 🔗 API Endpoints

### Chores API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chores` | Get all chores |
| GET | `/chores/{id}` | Get specific chore |
| GET | `/chores/person/{person}` | Get chores for a person |
| POST | `/chores` | Create new chore |
| PUT | `/chores/{id}` | Update chore |
| DELETE | `/chores/{id}` | Delete chore |
| PUT | `/chores/{id}/complete` | Mark chore as completed |
| PUT | `/chores/{id}/assign` | Assign chore to person |
| GET | `/earnings` | Get earnings summary |
| GET | `/earnings/{person}` | Get earnings for person |
| GET | `/electronics-status/{person}` | Get electronics status |

### Quicklist API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quicklist` | Get all quicklist items |
| GET | `/quicklist/{id}` | Get specific quicklist item |
| POST | `/quicklist` | Create quicklist item |
| DELETE | `/quicklist/{id}` | Delete quicklist item |
| POST | `/quicklist/{id}/create-chore` | Create chore from quicklist |
| POST | `/quicklist/initialize` | Initialize default quicklist |

## 📊 Data Models

### Chore
```javascript
{
  id: "chore_1234567890_abc123",
  name: "Clean your room",
  amount: 5.00,
  assignedTo: "Ben", // "Ben", "Theo", or "unassigned"
  completed: false,
  category: "regular", // "regular", "school", or "game"
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

### QuicklistChore
```javascript
{
  id: "quicklist_1234567890_abc123",
  name: "Dishes",
  amount: 0.50,
  category: "regular",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z"
}
```

## 🗄️ DynamoDB Schema

Single table design with partition key (PK) and sort key (SK):

| PK | SK | Entity Type |
|----|----| ------------|
| CHORE | chore_id | Chore |
| QUICKLIST | quicklist_id | QuicklistChore |

## 🔧 Environment Variables

The Lambda functions use these environment variables:

- `DYNAMODB_TABLE_NAME`: Name of the DynamoDB table
- `AWS_REGION`: AWS region for DynamoDB
- `ENVIRONMENT`: Environment name (dev/staging/prod)

## 🧪 Testing API Endpoints

### Initialize Default Quicklist
```bash
curl -X POST https://your-api-url/dev/quicklist/initialize
```

### Create a Chore
```bash
curl -X POST https://your-api-url/dev/chores \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Take out trash",
    "amount": 2.00,
    "category": "game",
    "assignedTo": "Ben"
  }'
```

### Get All Chores
```bash
curl https://your-api-url/dev/chores
```

### Complete a Chore
```bash
curl -X PUT https://your-api-url/dev/chores/{chore-id}/complete
```

## 🔄 Frontend Integration

Update your `index.html` to use the API:

```javascript
// Replace the existing Vue.js data with API calls
const API_BASE_URL = 'https://your-api-url/dev';

// Example: Load chores from API
async loadChores() {
  try {
    const response = await fetch(`${API_BASE_URL}/chores`);
    const data = await response.json();
    this.chores = data.chores;
  } catch (error) {
    console.error('Error loading chores:', error);
  }
}
```

## 📈 Monitoring & Logs

- **CloudWatch Logs**: Check `/aws/lambda/family-command-center-*` log groups
- **API Gateway Logs**: Enable in API Gateway console for detailed request logs
- **DynamoDB Metrics**: Monitor read/write capacity and throttling

## 🛠️ Development

### Local Development Setup

1. Install dependencies:
   ```bash
   cd src
   npm install
   ```

2. Set environment variables:
   ```bash
   export DYNAMODB_TABLE_NAME=FamilyCommandCenter-dev
   export AWS_REGION=us-east-1
   ```

3. Run tests:
   ```bash
   npm test
   ```

### Code Style

- Use ESLint for code formatting
- Follow Node.js best practices
- Use async/await for asynchronous operations

## 🔒 Security

- API uses CORS headers for browser compatibility
- DynamoDB access restricted to Lambda execution role
- No authentication required (family-internal use)
- Consider adding API keys for production use

## 💡 Next Steps

1. **Add Authentication**: Implement AWS Cognito for user management
2. **Add Caching**: Use ElastiCache for frequently accessed data
3. **Add Notifications**: Send notifications when chores are completed
4. **Add Analytics**: Track chore completion patterns
5. **Add Mobile App**: Create React Native app using the same API

## ❓ Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS headers are properly set in Lambda responses
2. **DynamoDB Access Denied**: Check IAM role permissions
3. **API Gateway 403**: Verify Lambda permissions for API Gateway
4. **Cold Start Delays**: Consider using provisioned concurrency for production

### Getting Help

- Check CloudWatch logs for detailed error messages
- Verify environment variables are set correctly
- Ensure DynamoDB table exists and is accessible
- Test endpoints individually to isolate issues

---

Built with ❤️ for efficient family management! 