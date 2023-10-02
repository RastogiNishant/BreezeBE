import { Font, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import MainHeader from './mainHeader';
import PropertyLandlordDetails from './propertyLandlordDetails';
import TenantProfile from './tenantProfile';
import IncomeDetails from './incomeDetails';
import Solvency from './solvency';
import dayjs from 'dayjs';
import { TFunction } from 'i18next';
import { getTranslation } from '../util/translatedKey';
import { INCOME_TYPES_KEYS, PUBLIC_CERTIFICATE_KEYS, SALUTATION } from '../util/constant';

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

const boolExpressions = (t: TFunction, value: any) =>
  value === undefined || value === null ? '-' : getTranslation(t, value ?'landlord.property.tenant_pref.solvency.rent_arrears.yes.message' : 'landlord.property.tenant_pref.solvency.rent_arrears.no.message');

const dateOfBirth = (day: any, age: any, place: any) =>
  day || age || place
    ? [dayConverter(day), age && `(${age}),`, place].filter(Boolean).join(' ')
    : '-';

const dayConverter = (day: string) =>
  dayjs(day).isValid() ? dayjs(day).format('DD.MM.YYYY') : day;

const mapDisplayValues = (tenant: any, members: any, t: TFunction) => ({
  tenant: {
    rental_space: `${tenant?.space_min || 0}-${tenant?.space_max || 1000}` + 'm²',
    household_size: `${tenant?.members_count} Persons`,
    rooms_min_max: `${tenant?.rooms_min || 0}-${tenant?.rooms_max || 1000}`,
    rent_budget: `€${tenant?.budget_min || 0}-${tenant?.budget_max || 10000}`,
    rent_duration: `${
      tenant?.residency_duration_min
        ? tenant?.residency_duration_min + '-' + tenant?.residency_duration_max
        : getTranslation(t, 'prospect.profile.adult.income.txt_contract_unlimited')
    }`,
    children: `${tenant?.minors_count || '-'}`,
    income_level: tenant?.income_level
      ? Array.isArray(tenant.income_level) &&
        PUBLIC_CERTIFICATE_KEYS.includes(tenant.income_level[0])
        ? getTranslation(t, tenant.income_level[0])
        : tenant.income_level
      : '-',
    pets: boolExpressions(t,tenant?.pets),
    parking: boolExpressions(t,tenant?.parking_space),
    rent_start: tenant?.rent_start ? dayConverter(tenant?.rent_start) : '-',
  },

  members: members?.map((member: any, index: number) => {
    const incomes = Array.isArray(member?.incomes) && member?.incomes[0];
    return {
      adultNumber: `${getTranslation(t, 'prospect.profile.adult.personal.txt_adult_ph.message')} ${index + 1}`,
      surName:
        member?.secondname && member?.firstname && member?.sex
          ? [
              member?.sex &&
                typeof member?.sex === 'number' &&
                getTranslation(t, SALUTATION[member?.sex - 1]),
              member?.firstname,
              member?.secondname,
            ]
              .filter(Boolean)
              .join(' ')
          : '-',
      dateOfBirth: dateOfBirth(member?.birthday, member?.age, member?.birth_place),
      citizenship: member?.citizen || '-',
      currentAddress: member?.last_address || '-',
      email: member?.email || '-',
      phone: member?.phone || '-',

      monthlyIncome: incomes?.income || '-',
      incomeSource: incomes?.income_type ? getTranslation(t, INCOME_TYPES_KEYS[incomes?.income_type as keyof typeof INCOME_TYPES_KEYS] + '.message') : '-',
      currentJob: incomes?.position || '-',
      jobDuration: incomes?.employment_type || '-',
      companyDetails: incomes?.company || '-',
      score: member?.credit_score || '-',

      rentArrears:
        (member?.rent_arrears_doc && boolExpressions(t,member?.rent_arrears_doc)) ||
        (member?.rent_arrears_doc_submit_later &&
          boolExpressions(t,member?.rent_arrears_doc_submit_later)) ||
        '-',
      unpaidRental: boolExpressions(t,member?.unpaid_rental),
      execution: boolExpressions(t,member?.unpaid_rental),
      insolvency: boolExpressions(t,member?.insolvency_proceed),
      cleanOut: boolExpressions(t,member?.clean_procedure),
      wage: boolExpressions(t,member?.income_seizure),
    };
  }),
});

export const TenantDocument = (props: { t: TFunction, tenant?: any, members?: any[] }) => {
  // props?.members.map((item, index) => console.log('member ' + index + 1, item));
  props?.members?.push({}, {});
  const { tenant, members } = mapDisplayValues(props?.tenant, props?.members, props?.t);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <View style={styles.headerWrapper}>
            <Text style={styles.pdfHeader}>
              {getTranslation(props?.t, 'prospect.profile.pdf.file_name')}
            </Text>
            <Image src={'../pdf/img/BreezeLogo.png'} style={styles.image} />
          </View>
        </View>
        <View style={styles.mainSection} wrap={false}>
          <MainHeader
            leftText={getTranslation(props?.t, 'prospect.rental_application.PROPERTYPREFERENCES')}
            rightText={getTranslation(props?.t, 'prospect.rental_application.HOUSEHOLD')}
            rightIcon={'../pdf/img/qrCode.png'}
          />
          <PropertyLandlordDetails
            leftLabel={getTranslation(props?.t, 'prospect.rental_application.Rentalspace')}
            leftValue={tenant?.rental_space}
            rightIcon
            rightLabel={getTranslation(props?.t, 'prospect.rental_application.HouseholdSize')}
            rightValue={tenant?.household_size}
          />
          <PropertyLandlordDetails
            leftLabel={getTranslation(props?.t, 'prospect.rental_application.Rooms')}
            leftValue={tenant?.rooms_min_max}
            rightLabel={getTranslation(props?.t, 'prospect.rental_application.UseType')}
            rightValue={getTranslation(props.t, 'property.attribute.OCCUPATION_TYPE.Private_Use.message')}
          />
          <PropertyLandlordDetails
            leftLabel={getTranslation(props?.t, 'prospect.rental_application.Rent_duration')}
            leftValue={
              <>
                <Text style={{ fontWeight: 'bold' }}>{tenant?.rent_budget}, </Text>
                <Text>{tenant?.rent_duration}</Text>
              </>
            }
            rightLabel={getTranslation(props?.t, 'prospect.rental_application.Children')}
            rightValue={tenant?.children}
          />
          <PropertyLandlordDetails
            leftLabel={getTranslation(props?.t, 'prospect.rental_application.PublicCertificate')}
            leftValue={tenant?.income_level}
            rightLabel={getTranslation(props?.t, 'prospect.rental_application.Petsintended')}
            rightValue={tenant?.pets}
          />
          <PropertyLandlordDetails
            leftLabel={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Rent_start.message'
            )}
            leftValue={tenant?.rent_start.padStart(10, '0')}
            rightLabel={getTranslation(
              props?.t,
              'prospect.rental_application.InterestatParking_Garage'
            )}
            rightValue={tenant?.parking}
          />
          <TenantProfile
            tenantHeader={getTranslation(props?.t, 'prospect.rental_application.PERSONAL')}
            firstLabel={getTranslation(props?.t, 'prospect.rental_application.NameandSurname')}
            secondLabel={getTranslation(
              props?.t,
              'prospect.rental_application.Date_Age_andplaceofbirth'
            )}
            thirdLabel={getTranslation(props?.t, 'prospect.rental_application.Citizenship')}
            fourthLabel={getTranslation(props?.t, 'prospect.rental_application.CurrentAddress')}
            fifthLabel={getTranslation(props?.t, 'prospect.rental_application.Email')}
            sixthLabel={getTranslation(props?.t, 'prospect.rental_application.Tel')}
            tenantDetails={Array.isArray(members) && members.length >= 1 && members.slice(0, 2)}
          />
          <IncomeDetails
            incomeHeader={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Income.message'
            )}
            monthlyIncome={getTranslation(
              props?.t,
              'prospect.rental_application.TotalNetMonthlyIncome'
            )}
            incomeSource={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Income_Source.message'
            )}
            currentJob={getTranslation(
              props?.t,
              'prospect.rental_application.CurrentJobwithStartDate'
            )}
            jobDuration={getTranslation(props?.t, 'prospect.rental_application.JobTypeandDuration')}
            companyDetails={getTranslation(
              props?.t,
              'prospect.rental_application.Companyname_address'
            )}
            page={getTranslation(props?.t, 'web.letting.tenant_profile.export.page.message')}
            incomeDetails={Array.isArray(members) && members.length >= 1 && members.slice(0, 2)}
          />
          <Solvency
            isCreditHistoryShown
            solvencyHeader={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Solvency.message'
            )}
            score={getTranslation(props?.t, 'prospect.rental_application.CreditHistory')}
            rentArrears={getTranslation(props?.t, 'prospect.rental_application.RentArrears')}
            unpaidRental={getTranslation(
              props?.t,
              'prospect.rental_application.UnpaidRentalObligations'
            )}
            execution={getTranslation(
              props?.t,
              'prospect.profile.adult.creditworthiness.question2'
            )}
            insolvency={getTranslation(
              props?.t,
              'web.letting.tenant_profile.export.Insolvency_procedings.message'
            )}
            cleanOut={getTranslation(props?.t, 'prospect.profile.adult.creditworthiness.question5')}
            wage={getTranslation(props?.t, 'prospect.profile.adult.creditworthiness.question6')}
            page={getTranslation(props?.t, 'web.letting.tenant_profile.export.page.message')}
            solvencyDetails={Array.isArray(members) && members.length >= 1 && members.slice(0, 2)}
          />
          <View style={styles.section}>
            <View style={styles.footerSegment}>
              <View style={styles.footerWrapper}>
                <Text style={styles.footerStyles}>{getTranslation(props?.t, 'prospect.rental_application.Thisprofileactivatedby')}</Text>
              </View>
            </View>
            <View style={[styles.footerSegment, { marginLeft: '7.5px' }]}>
              <View style={styles.footerWrapper}>
                <Text style={styles.footerStyles}>
                  {members[0]?.surName}, {dayjs().format('HH:mm DD.MM.YYYY')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
