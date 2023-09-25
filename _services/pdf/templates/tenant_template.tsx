import { Font, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import MainHeader from './mainHeader';
import PropertyLandlordDetails from './propertyLandlordDetails';
import TenantProfile from './tenantProfile';
import IncomeDetails from './incomeDetails';
import Solvency from './solvency';

Font.register({
  family: 'Montserrat',
  fonts: [
    { src: '../pdf/fonts/Montserrat-Regular.ttf', fontStyle: 'normal' },
    { src: '../pdf/fonts/Montserrat-Regular.ttf', fontStyle: 'italic' },
    { src: '../pdf/fonts/Montserrat-SemiBold.ttf', fontWeight: 600, fontStyle: 'italic' },
    { src: '../pdf/fonts/Montserrat-SemiBold.ttf', fontWeight: 700, fontStyle: 'normal' },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#fff',
    fontFamily: 'Montserrat',
    fontSize: 11,
    paddingLeft: 50,
    lineHeight: 1.5,
    flexDirection: 'column',
  },
  headerWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '30px',
    justifyContent: 'center',
    alignContent: 'center',
  },
  pdfHeader: {
    fontSize: 18,
    fontWeight: 900,
    marginRight: '70px',
    fontFamily: 'Montserrat',
    textTransform: 'uppercase',
  },
  logo: {
    maxWidth: 100,
    marginRight: '50px',
  },
  image: {
    position: 'absolute',
    right: 50,
    padding: 0,
    width: '80px',
    top: 0,
    opacity: 0.8,
  },
  mainSection: {
    position: 'relative',
    paddingTop: 10,
    paddingRight: '50',
    marginTop: 10,
  },
  section: {
    marginTop: '100px',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  footerSegment: {
    flex: '0 0 33%',
  },
  footerWrapper: {
    backgroundColor: '#F6FCFC',
    fontSize: '7px',
    paddingLeft: '7px',
    borderRadius: '5px',
    marginBottom: '5px',
    alignItems: 'center',
    flexDirection: 'row',
    fontWeight: 700,
    height: 15,
  },
  footerStyles: {
    paddingTop: '3.5px',
    marginLeft: '7px',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const mapDisplayValues = (tenant: any, members: any) => ({
  tenant: {
    rental_space: `${tenant?.space_min || 0}-${tenant?.space_max || 1000}` + "m²",
    household_size: `${tenant?.members_count} Persons`,
    rooms_min_max: `${tenant?.rooms_min || 0}-${tenant?.rooms_max || 1000}`,
    rent_budget: `€${tenant?.budget_max || 10000}`,
    rent_duration: `${tenant?.residency_duration_min ? tenant?.residency_duration_min + "-" + tenant?.residency_duration_max : "unlimited"}`,
    children: `${tenant?.minors_count || "-"}`,
    pets: `${tenant?.pets ? "Yes" : "-"}`,
    parking: `${tenant?.parking_space ? "Yes" : "-"}`,

  },
  members: members?.map((member: any) => ({
    
  })),
});

export const TenantDocument = (props: { tenant?: any, members?: any[]}) => {
  props?.members?.push(props?.tenant);
  const {tenant, members} = mapDisplayValues(props?.tenant, props?.members);
  return (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        <View style={styles.headerWrapper}>
          <Text style={styles.pdfHeader}>RENTAL APPLICATION</Text>
          <Image src={'../pdf/img/BreezeLogo.png'} style={styles.image} />
        </View>
      </View>
      <View style={styles.mainSection} wrap={false}>
        <MainHeader
          leftText="PROPERTY PREFERENCES"
          rightText="HOUSEHOLD"
          rightIcon={'../pdf/img/qrCode.png'}
        />
        <PropertyLandlordDetails
          leftLabel="Rental space"
          leftValue={tenant?.rental_space}
          rightIcon
          rightLabel="Household size"
          rightValue={tenant?.household_size}
        />
        <PropertyLandlordDetails
          leftLabel="Rooms"
          leftValue={tenant?.rooms_min_max}
          rightLabel="User Type"
          rightValue="home office"
        />
        <PropertyLandlordDetails
          leftLabel="Rent, duration"
          leftValue={
            <>
              <Text style={{ fontWeight: 'bold' }}>{tenant?.rent_budget}, </Text>
              <Text>{tenant?.rent_duration}</Text>
            </>
          }
          rightLabel="Children"
          rightValue={tenant?.children}
        />
        <PropertyLandlordDetails
          leftLabel="Public Certificate"
          leftValue="Certificate I (12.02.2024)"
          rightLabel="Pets intended"
          rightValue={tenant?.pets}
        />
        <PropertyLandlordDetails
          leftLabel="Rent start"
          leftValue="01.01.2022"
          rightLabel="Interest at Parking/Garage"
          rightValue={tenant?.parking}
        />
        <TenantProfile
          tenantHeader="PERSONAL"
          firstLabel="Name and Surname:"
          secondLabel="Date (Age) and place of birth:"
          thirdLabel="Citizenship:"
          fourthLabel="Current Address:"
          fifthLabel="Email:"
          sixthLabel="Tel."
          tenantDetails={[
            {
              adultNumber: 'RESIDENT 1',
              adultFirstName: 'Mr. Bill',
              adultLastName: 'Gates',
              dateOfBirth: '13.02.1969 (65), Berlin',
              citizenship: 'German',
              currentAddress: 'Mieterstr. 1, 10117 Berlin',
              email: 'gates@ms.com',
              phone: '+49 1512092223',
            },
            {
              adultNumber: 'RESIDENT 2',
              adultFirstName: 'Ms. Melinda',
              adultLastName: 'Gates',
              dateOfBirth: '13.02.1989 (55), Berlin',
              citizenship: 'German',
              currentAddress: 'Mieterstr. 1, 10117 Berlin',
              email: 'melinda@ms.com',
              phone: '+49 1512092223',
            },
          ]}
        />
        <IncomeDetails
          incomeHeader="INCOME"
          monthlyIncome="Total Net Monthly Income"
          incomeSource="Income Source"
          currentJob="Current Job with Start Date"
          jobDuration="Job Type and Duration"
          companyDetails="Company name, address"
          page="page"
          incomeDetails={[
            {
              monthlyIncome: '4000$/mo',
              incomeSource: 'Employee, Pension',
              currentJob: 'Manager, 1 yr 3 mos',
              jobDuration: 'Unlimited, Part-Time',
              companyDetails: 'Daimler',
              incomePageNumbers: {
                startPage: 2,
                endPage: 4,
              },
            },
            {
              monthlyIncome: '4000$/mo',
              incomeSource: 'Private, Child benefit',
              currentJob: 'Housewife, 1 yr 3 mos',
              jobDuration: 'Limited, Full-Time',
              companyDetails: 'Kiosk',
              incomePageNumbers: {
                startPage: 7,
                endPage: 8,
              },
            },
          ]}
        />
        <Solvency
          isCreditHistoryShown
          solvencyHeader="SOLVENCY"
          score="Credit History"
          rentArrears="Rent Arrears"
          unpaidRental="Unpaid Rental Obligations"
          execution="Execution against you"
          insolvency="Insolvency procedings against you"
          cleanOut="Clean-out procedure again"
          wage="Wage/Income seizure"
          page="page"
          solvencyDetails={[
            {
              score: 'No negative data',
              rentArrears: 'No',
              unpaidRental: 'Yes',
              execution: 'Yes',
              insolvency: 'Yes',
              cleanOut: 'Yes',
              wage: 'No',
              pageNumber: 3,
              rentArrearsPageNumber: 9,
            },
            {
              score: 'No negative data',
              rentArrears: 'No',
              unpaidRental: 'Yes',
              execution: 'Yes',
              insolvency: 'Yes',
              cleanOut: 'Yes',
              wage: 'No',
              pageNumber: 6,
              rentArrearsPageNumber: 5,
            },
          ]}
        />
        <View style={styles.section}>
          <View style={styles.footerSegment}>
            <View style={styles.footerWrapper}>
              <Text style={styles.footerStyles}>This profile activated by</Text>
            </View>
          </View>
          <View style={[styles.footerSegment, { marginLeft: '7.5px' }]}>
            <View style={styles.footerWrapper}>
              <Text style={styles.footerStyles}>Mr. Bill Gates, 10:47 12.10.2021</Text>
            </View>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);
}