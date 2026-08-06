use test
print('patients count ' + db.patients.countDocuments({patientId:'P1002'}))
printjson(db.patients.find({patientId:'P1002'}).toArray())
use test
print('health_twins count ' + db.health_twins.countDocuments({patientId:'P1002'}))
printjson(db.health_twins.find({patientId:'P1002'}).toArray())
use consentdb
print('consents count ' + db.consents.countDocuments({patientId:'P1002'}))
printjson(db.consents.find({patientId:'P1002'}).toArray())
