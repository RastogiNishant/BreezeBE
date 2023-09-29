import { Font, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import MainHeader from './mainHeader';
import PropertyLandlordDetails from './propertyLandlordDetails';
import TenantProfile from './tenantProfile';
import IncomeDetails from './incomeDetails';
import Solvency from './solvency';
import dayjs from 'dayjs';
import { TFunction } from 'i18next';
import { getTranslation } from '../util/translatedKey';
import { PUBLIC_CERTIFICATE_KEYS } from '../util/constant';

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

const boolExpressions = (value: any) =>
  value === undefined || value === null ? '-' : value ? 'Yes' : 'No';

const dateOfBirth = (age: any, day: any, place: any) =>
  day || age || place ? day && `${day}` + age && `(${age})` + place && place : '-';

const dayConverter = (day: string) =>
  dayjs(day).isValid() ? dayjs(day).format('DD-MM-YYYY') : day;

const mapDisplayValues = (tenant: any, members: any, t: TFunction) => ({
  tenant: {
    rental_space: `${tenant?.space_min || 0}-${tenant?.space_max || 1000}` + 'm²',
    household_size: `${tenant?.members_count} Persons`,
    rooms_min_max: `${tenant?.rooms_min || 0}-${tenant?.rooms_max || 1000}`,
    rent_budget: `€${tenant?.budget_min || 0}-${tenant?.budget_max || 10000}`,
    rent_duration: `${
      tenant?.residency_duration_min
        ? tenant?.residency_duration_min + '-' + tenant?.residency_duration_max
        : 'unlimited'
    }`,
    children: `${tenant?.minors_count || '-'}`,
    income_level: tenant?.income_level
      ? Array.isArray(tenant.income_level) &&
        PUBLIC_CERTIFICATE_KEYS.includes(tenant.income_level[0])
        ? getTranslation(t, tenant.income_level[0])
        : tenant.income_level
      : '-',
    pets: `${tenant?.pets ? 'Yes' : '-'}`,
    parking: `${tenant?.parking_space ? 'Yes' : '-'}`,
    rent_start: tenant?.rent_start ? dayConverter(tenant?.rent_start) : '-',
  },

  members: members?.map((member: any, index: number) => {
    const incomes = Array.isArray(member?.incomes) && member?.incomes[0];
    return {
      adultNumber: `RESIDENT ${index + 1}`,
      adultFirstName: member?.firstname || '-',
      adultLastName: member?.secondname || '-',
      dateOfBirth: dateOfBirth(member?.age, member?.birthday, member?.birth_place),
      citizenship: member?.citizen || '-',
      currentAddress: member?.last_address || '-',
      email: member?.email || '-',
      phone: member?.phone || '-',

      monthlyIncome: incomes?.income || '-',
      incomeSource: incomes?.income_type || '-',
      currentJob: incomes?.position || '-',
      jobDuration: incomes?.employment_type || '-',
      companyDetails: incomes?.company || '-',
      score: member?.credit_score || '-',

      rentArrears:
        (member?.rent_arrears_doc && boolExpressions(member?.rent_arrears_doc)) ||
        (member?.rent_arrears_doc_submit_later &&
          boolExpressions(member?.rent_arrears_doc_submit_later)) ||
        '-',
      unpaidRental: boolExpressions(member?.unpaid_rental),
      execution: boolExpressions(member?.unpaid_rental),
      insolvency: boolExpressions(member?.insolvency_proceed),
      cleanOut: boolExpressions(member?.clean_procedure),
      wage: boolExpressions(member?.income_seizure),
    };
  }),
});

export const TenantDocument = (props: { t: TFunction, tenant?: any, members?: any[] }) => {
  props?.members?.push({}, {});
  const { tenant, members } = mapDisplayValues(props?.tenant, props?.members, props?.t);

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
            leftLabel={getTranslation(props?.t, 'prospect.rental_application.PublicCertificate')}
            leftValue={tenant?.income_level}
            rightLabel="Pets intended"
            rightValue={tenant?.pets}
          />
          <PropertyLandlordDetails
            leftLabel="Rent start"
            leftValue={tenant?.rent_start.padStart(10, '0')}
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
            tenantDetails={Array.isArray(members) && members.length >= 1 && members.slice(0, 2)}
          />
          <IncomeDetails
            incomeHeader="INCOME"
            monthlyIncome="Total Net Monthly Income"
            incomeSource="Income Source"
            currentJob="Current Job with Start Date"
            jobDuration="Job Type and Duration"
            companyDetails="Company name, address"
            page="page"
            incomeDetails={Array.isArray(members) && members.length >= 1 && members.slice(0, 2)}
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
            solvencyDetails={Array.isArray(members) && members.length >= 1 && members.slice(0, 2)}
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
};
