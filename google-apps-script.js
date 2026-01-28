/**
 * Google Apps Script for saving player goals to Google Sheets
 * 
 * Instructions:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Paste this code
 * 4. Update the SPREADSHEET_ID and SHEET_NAME variables below
 * 5. Deploy as a web app:
 *    - Click "Deploy" > "New deployment"
 *    - Choose "Web app" as type
 *    - Execute as: Me
 *    - Who has access: Anyone
 *    - Click "Deploy"
 * 6. Copy the Web app URL and paste it into index.html as GOALS_SCRIPT_URL
 */

const SPREADSHEET_ID = '1B1vGXMxxM5BfkW6dyoyQvO1MlQ1-RsLdKvu0JoS9IDU';
const SHEET_NAME = 'playerinfo';

function doPost(e) {
  try {
    let data;
    let rawData = '';
    
    // Log what we received for debugging
    Logger.log('doPost called');
    Logger.log('e.postData: ' + (e.postData ? 'exists' : 'null'));
    Logger.log('e.parameter: ' + (e.parameter ? JSON.stringify(e.parameter) : 'null'));
    
    // Handle JSON POST data
    if (e.postData) {
      Logger.log('postData.type: ' + e.postData.type);
      if (e.postData.contents) {
        rawData = e.postData.contents;
        Logger.log('postData.contents: ' + rawData.substring(0, 100));
      } else {
        try {
          rawData = e.postData.getDataAsString();
          Logger.log('getDataAsString: ' + rawData.substring(0, 100));
        } catch (err) {
          Logger.log('Error getting data as string: ' + err);
        }
      }
      
      if (rawData) {
        try {
          data = JSON.parse(rawData);
          Logger.log('Successfully parsed JSON');
        } catch (parseError) {
          Logger.log('JSON parse error: ' + parseError.toString());
          return ContentService.createTextOutput(JSON.stringify({error: 'JSON parse error: ' + parseError.toString(), rawData: rawData.substring(0, 200)})).setMimeType(ContentService.MimeType.JSON);
        }
      } else {
        return ContentService.createTextOutput(JSON.stringify({error: 'No postData contents', type: e.postData.type})).setMimeType(ContentService.MimeType.JSON);
      }
    } else if (e.parameter && e.parameter.data) {
      // Handle URL parameter (GET or form data)
      Logger.log('Using parameter.data');
      try {
        data = JSON.parse(e.parameter.data);
      } catch (parseError) {
        // Try decoding first
        const decoded = decodeURIComponent(e.parameter.data);
        data = JSON.parse(decoded);
      }
    } else {
      Logger.log('No data found in postData or parameter');
      return ContentService.createTextOutput(JSON.stringify({error: 'No data received', hasPostData: !!e.postData, hasParameter: !!e.parameter})).setMimeType(ContentService.MimeType.JSON);
    }
    
    const playerName = data.player;
    const goals = data.goals; // Object with dates as keys and counts as values
    const total = data.total;
    
    // Log for debugging
    Logger.log('Received data: ' + JSON.stringify(data));
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      sheet.getRange(1, 1).setValue('Player');
    }
    
    // Find or create player row
    const lastRow = sheet.getLastRow();
    const headers = lastRow > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : ['Player'];
    let playerRow = findPlayerRow(sheet, playerName);
    
    if (playerRow === -1) {
      // Player doesn't exist, add new row
      playerRow = sheet.getLastRow() + 1;
      sheet.getRange(playerRow, 1).setValue(playerName);
    }
    
    // Update total goals
    const totalCol = getColumnIndex(headers, 'Total Goals');
    if (totalCol === -1) {
      // Add Total Goals column if it doesn't exist
      const newCol = sheet.getLastColumn() + 1;
      sheet.getRange(1, newCol).setValue('Total Goals');
      sheet.getRange(playerRow, newCol).setValue(total);
    } else {
      sheet.getRange(playerRow, totalCol).setValue(total);
    }
    
    // Update individual goal dates
    Object.keys(goals).forEach(date => {
      let colIndex = getColumnIndex(headers, date);
      if (colIndex === -1) {
        // Add new date column
        const newCol = sheet.getLastColumn() + 1;
        sheet.getRange(1, newCol).setValue(date);
        colIndex = newCol;
      }
      sheet.getRange(playerRow, colIndex).setValue(goals[date]);
    });
    
    Logger.log('Successfully saved goals for ' + playerName);
    return ContentService.createTextOutput(JSON.stringify({success: true, player: playerName, total: total})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({error: error.toString(), stack: error.stack})).setMimeType(ContentService.MimeType.JSON);
  }
}

function findPlayerRow(sheet, playerName) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === playerName) {
      return i + 1; // +1 because sheet rows are 1-indexed
    }
  }
  return -1;
}

function getColumnIndex(headers, headerName) {
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === headerName) {
      return i + 1; // +1 because sheet columns are 1-indexed
    }
  }
  return -1;
}

// Test function - call this from the browser to verify the script is working
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({status: 'Sheet not found', sheetName: SHEET_NAME})).setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    const data = sheet.getDataRange().getValues();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'OK',
      sheetName: SHEET_NAME,
      rows: lastRow,
      cols: lastCol,
      sampleData: data.slice(0, 5) // First 5 rows
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}
