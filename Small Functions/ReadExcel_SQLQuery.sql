

USE [master]
GO

--CONFIGURING SQL INSTANCE TO ACCEPT ADVANCED OPTIONS
EXEC sp_configure 'show advanced options', 1
RECONFIGURE
GO

--ENABLING USE OF DISTRIBUTED QUERIES
EXEC sp_configure 'Ad Hoc Distributed Queries', 1
RECONFIGURE
GO


USE [master]
GO
--ADD DRIVERS IN SQL INSTANCE
EXEC master.dbo.sp_MSset_oledb_prop N'Microsoft.ACE.OLEDB.12.0', N'AllowInProcess', 1
GO

EXEC master.dbo.sp_MSset_oledb_prop N'Microsoft.ACE.OLEDB.12.0', N'DynamicParameters', 1
GO


-- 'C:\Users\aaron.hogancamp\AppData\Local\Microsoft\Windows\INetCache\Content.Outlook\Z99JWNRJ\Claims_Universe_Header_Table_ACO_PA_mercy_v1.1.xlsx' & ";" & _

USE [DMDataScienceWorkspace]
GO
--CONSULTING A SPREADSHEET
SELECT * 
INTO #TempTable
FROM OPENROWSET('Microsoft.ACE.OLEDB.12.0',
'Excel 12.0 XML; 
 Database=C:\Users\aaron.hogancamp\AppData\Local\Microsoft\Windows\INetCache\Content.Outlook\Z99JWNRJ\Claims_Universe_Header_Table_ACO_PA_mercy_v1.1.xlsx; 
 HDR=YES;
 IMEX=1',
'SELECT * FROM [Claim_Header$]') 
GO

SELECT * FROM #TempTable
GO
